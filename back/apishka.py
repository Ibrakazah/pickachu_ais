from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests

app = FastAPI(title="Pickachu Smart Platform API")

# Настройка CORS, чтобы фронтенд мог достучаться
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

# Глобальная сессия (память сервера)
SESSION = {
    "token": None,
    "chat_token": None,
    "school_id": None,
    "group_id": None,
    "student_name": None,
    "edu_year": 2025,
    "user_id": None,
    "group_uuid": None
}

class LoginPayload(BaseModel):
    username: str
    password: str

# ==========================================
# 1. АВТОРИЗАЦИЯ
# ==========================================
@app.post("/api/v1/auth/verify")
async def verify_user(req: LoginPayload):
    auth_res = requests.post('https://api.bilimclass.kz/api/v2/os/login', json={
        "eduYear": SESSION["edu_year"], "login": req.username, "password": req.password
    }, headers={'origin': 'https://www.bilimclass.kz', 'user-agent': 'Mozilla/5.0'})

    if auth_res.status_code != 200:
        raise HTTPException(status_code=401, detail="Логин немесе пароль дұрыс емес")

    auth_data = auth_res.json()
    data = auth_data.get('user_info', {})

    # Сохраняем все ключи для дальнейших запросов к журналу
    SESSION["token"] = auth_data.get('access_token')
    SESSION["school_id"] = data.get('school_id')
    SESSION["group_id"] = data.get('group', {}).get('id')
    SESSION["student_name"] = f"{data.get('firstname')} {data.get('surname')}"
    SESSION["chat_token"] = data.get('chatToken')
    SESSION["user_id"] = data.get('userId') or data.get('id')
    SESSION["group_uuid"] = data.get('studentInfo', {}).get('studentGroupUuid')

    return {"status": "success", "student_name": SESSION["student_name"]}

# ==========================================
# 2. ПОЛУЧЕНИЕ ОЦЕНОК (ПОЛНАЯ ЛОГИКА)
# ==========================================
@app.get("/api/v1/grades/quarter")
async def get_quarter_grades(period: int = Query(1)):
    if not SESSION["token"] or not SESSION["chat_token"]:
        raise HTTPException(status_code=403, detail="Авторизациядан өтіңіз!")

    headers_main = {'authorization': f'Bearer {SESSION["token"]}', 'x-school-id': str(SESSION["school_id"])}
    headers_journal = {
        'accept': 'application/json',
        'authorization': f'Bearer {SESSION["chat_token"]}',
        'external': '1', 'origin': 'https://www.bilimclass.kz', 'user-agent': 'Mozilla/5.0',
        'x-school-id': str(SESSION["school_id"])
    }

    try:
        # 1. Запрос списка предметов
        res_sub = requests.get('https://api.bilimclass.kz/api/v4/os/clientoffice/diary/subjects',
            headers=headers_main, params={
                "schoolId": SESSION["school_id"], "eduYear": SESSION["edu_year"],
                "period": period, "periodType": "quarter", "groupId": SESSION["group_id"]
            })

        # Настройка дат четвертей
        dates = {
            1: ("2025-09-01T00:00:00.000Z", "2025-10-31T00:00:00.000Z"),
            2: ("2025-11-01T00:00:00.000Z", "2025-12-31T00:00:00.000Z"),
            3: ("2026-01-01T00:00:00.000Z", "2026-03-31T00:00:00.000Z"),
            4: ("2026-04-01T00:00:00.000Z", "2026-05-31T00:00:00.000Z"),
        }
        dateFrom, dateTo = dates.get(period, dates[1])

        # 2. Запрос детальных оценок
        res_marks = requests.get('https://journal-service.bilimclass.kz/diary/quarter',
            headers=headers_journal, params={
                "schoolId": SESSION["school_id"], "eduYear": SESSION["edu_year"],
                "userId": SESSION["user_id"], "studentGroupUuid": SESSION["group_uuid"],
                "dateFrom": dateFrom, "dateTo": dateTo
            })

        sub_data = res_sub.json().get('data', []) if res_sub.status_code == 200 else []
        marks_data = res_marks.json().get('data', {}) if res_marks.status_code == 200 else {}

        # Формируем структуру таблицы
        table = {}
        for s in sub_data:
            sid = str(s.get('subjectId'))
            table[sid] = {
                "subject_name": s.get('subjectName', '').strip(),
                "marks": [],
                "percent_fb": '-', "percent_bjb": '-', "percent_tjb": '-',
                "finalGrade": 3
            }

        # 3. Раскидываем оценки и считаем их проценты
        for l_uuid, info in marks_data.items():
            for cat, m_type in [('formattedScore', 'ФО'), ('sor', 'БЖБ'), ('soch', 'ТЖБ')]:
                m_info = info.get(cat)
                if m_info and isinstance(m_info, dict) and m_info.get('mark') is not None:
                    sid = str(m_info.get('subjectId'))
                    if sid in table:
                        val = m_info.get('mark')
                        mmax = m_info.get('markMax')

                        # Расчет процента для конкретной оценки
                        p = (float(val) / float(mmax) * 100) if mmax and float(mmax) > 0 else 0

                        table[sid]["marks"].append({
                            "val": f"{val}/{mmax}" if mmax else str(val),
                            "raw_val": float(val),
                            "max": float(mmax) if mmax else float(val), # Если макс не пришел, берем сам балл
                            "percent": round(p, 1),
                            "type": m_type
                        })

        # 4. Расчет средних по колонкам (чтобы не было пустых прочерков)
        for sid, subject in table.items():
            for m_type, key in [('ФО', 'percent_fb'), ('БЖБ', 'percent_bjb'), ('ТЖБ', 'percent_tjb')]:
                cat_marks = [m['percent'] for m in subject['marks'] if m['type'] == m_type]
                if cat_marks:
                    avg = sum(cat_marks) / len(cat_marks)
                    subject[key] = f"{int(avg)}%" if avg.is_integer() else f"{round(avg, 1)}%"

        return {"status": "success", "table": list(table.values())}

    except Exception as e:
        print(f"🔥 ОШИБКА БЭКЕНДА: {e}")
        return {"status": "error", "table": []}