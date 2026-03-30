from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import requests

app = FastAPI(title="Pickachu Smart Platform API")

# Настройка CORS для работы с фронтендом (React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# ==========================================
# МОКОВЫЕ ДАННЫЕ (ДЛЯ ХАКАТОНА)
# ==========================================

# 1. Фейковые пользователи
MOCK_USERS = {
    "student1": {"password": "123", "role": "student", "name": "Алиев Арман", "class_name": "10 A", "id": "s1"},
    "student2": {"password": "123", "role": "student", "name": "Бекова Аяжан", "class_name": "10 A", "id": "s2"},
    "student3": {"password": "123", "role": "student", "name": "Ким Денис", "class_name": "10 A", "id": "s3"},
    "student4": {"password": "123", "role": "student", "name": "Оспанов Диас", "class_name": "10 A", "id": "s4"},
    "student5": {"password": "123", "role": "student", "name": "Сәкенқызы Мәдина", "class_name": "10 A", "id": "s5"},
}

# 2. Фейковые новости
MOCK_NEWS = [
    {
        "id": 1,
        "title": "AIS Хакатоны басталды!",
        "date": "28 наурыз - 30 наурыз",
        "description": "Мектебімізде жыл сайынғы IT хакатоны басталды. Барлық қатысушыларға сәттілік!",
        "image": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1000&auto=format&fit=crop"
    },
    {
        "id": 2,
        "title": "Көктемгі демалыс",
        "date": "21 наурыз - 1 сәуір",
        "description": "Оқушылар үшін көктемгі демалыс күндері басталды.",
        "image": "https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=1000&auto=format&fit=crop"
    }
]

# 3. База данных мок-оценок
def generate_default_grades():
    subjects = ["Алгебра", "Геометрия", "Физика", "Орыс тілі", "Қазақ әдебиеті", "Ағылшын тілі"]
    db = {}
    for s_id in ["s1", "s2", "s3", "s4", "s5"]:
        student_table = {}
        for i, subj in enumerate(subjects):
            student_table[str(i)] = {
                "subject_name": subj,
                "marks": [{"val": "9/10", "raw_val": 9.0, "max": 10.0, "percent": 90.0, "type": "ФО"}],
                "percent_fb": "-", "percent_bjb": "-", "percent_tjb": "-", "finalGrade": 3
            }
        db[s_id] = student_table
    return db

MOCK_GRADES_DB = generate_default_grades()

# 4. База данных для портфолио (ПРОЕКТЫ) - ПУСТАЯ изначально
PORTFOLIO_DB = { uid: [] for uid in MOCK_USERS.keys() }

# 5. База данных для портфолио (НАВЫКИ) - ПУСТАЯ изначально
SKILLS_DB = { uid: [] for uid in MOCK_USERS.keys() }

# Глобальная сессия (память сервера)
SESSION = {
    "token": None,
    "chat_token": None,
    "school_id": None,
    "group_id": None,
    "student_name": None,
    "edu_year": 2025,
    "user_id": None,
    "group_uuid": None,
    "class_name": None,  # Класс (напр. 10 A)
    "subgroup": None,    # Подгруппа
    "role": "student"    # Роль
}

class LoginPayload(BaseModel):
    username: str
    password: str

# ==========================================
# 1. АВТОРИЗАЦИЯ И СБОР ДАННЫХ ПРОФИЛЯ
# ==========================================
@app.post("/api/v1/auth/verify")
async def verify_user(req: LoginPayload):
    # ПРОВЕРКА НА МОКОВОГО ПОЛЬЗОВАТЕЛЯ
    if req.username in MOCK_USERS and MOCK_USERS[req.username]["password"] == req.password:
        user = MOCK_USERS[req.username]
        SESSION["token"] = "mock_token"
        SESSION["chat_token"] = "mock_chat"
        SESSION["user_id"] = user["id"]
        SESSION["student_name"] = user["name"]
        SESSION["class_name"] = user["class_name"]
        SESSION["subgroup"] = "1-группа"
        SESSION["role"] = user["role"]

        print(f"🚀 МОК ВХОД: {user['name']} (Роль: {user['role']})")
        return {
            "status": "success",
            "student_name": SESSION["student_name"],
            "class_name": SESSION["class_name"],
            "subgroup": SESSION["subgroup"],
            "role": SESSION["role"]
        }

    # ЕСЛИ НЕ МОК - ОБРАЩАЕМСЯ К BILIMCLASS
    auth_res = requests.post('https://api.bilimclass.kz/api/v2/os/login', json={
        "eduYear": SESSION["edu_year"],
        "login": req.username,
        "password": req.password
    }, headers={'origin': 'https://www.bilimclass.kz', 'user-agent': 'Mozilla/5.0'})

    if auth_res.status_code != 200:
        raise HTTPException(status_code=401, detail="Логин немесе пароль дұрыс емес")

    auth_data = auth_res.json()
    user_info = auth_data.get('user_info', {})
    group_info = user_info.get('group', {})
    student_info = user_info.get('studentInfo', {})

    # --- СОХРАНЯЕМ ДАННЫЕ В СЕССИЮ ---
    SESSION["token"] = auth_data.get('access_token')
    SESSION["school_id"] = user_info.get('school_id')
    SESSION["group_id"] = group_info.get('id')
    SESSION["student_name"] = f"{user_info.get('firstname')} {user_info.get('surname')}"
    SESSION["chat_token"] = user_info.get('chatToken')
    SESSION["user_id"] = str(user_info.get('userId') or user_info.get('id'))
    SESSION["group_uuid"] = student_info.get('studentGroupUuid')

    # ВЫТАСКИВАЕМ КЛАСС И ПОДГРУППУ
    SESSION["class_name"] = group_info.get('name', 'Не указан')
    SESSION["subgroup"] = student_info.get('subGroupName') or "Общая группа"
    SESSION["role"] = "student"

    # Инициализируем БД для нового пользователя, если его нет
    uid = SESSION["user_id"]
    if uid not in PORTFOLIO_DB: PORTFOLIO_DB[uid] = []
    if uid not in SKILLS_DB: SKILLS_DB[uid] = []

    print(f"✅ ВХОД (BilimClass): {SESSION['student_name']} | Класс: {SESSION['class_name']} | Группа: {SESSION['subgroup']}")

    return {
        "status": "success",
        "student_name": SESSION["student_name"],
        "class_name": SESSION["class_name"],
        "subgroup": SESSION["subgroup"],
        "role": SESSION["role"]
    }

# ==========================================
# 2. ДАННЫЕ ДЛЯ ГЛАВНОЙ СТРАНИЦЫ (ХАКАТОН)
# ==========================================
@app.get("/api/v1/home/data")
async def get_home_data():
    recent_grades = []

    if SESSION["user_id"] and SESSION["user_id"].startswith("s"):
        student_grades = MOCK_GRADES_DB.get(SESSION["user_id"], {})
        for sid, subj in student_grades.items():
            if subj["marks"]:
                last_m = subj["marks"][-1]
                recent_grades.append({
                    "subject": subj["subject_name"],
                    "score": str(last_m["raw_val"]).replace('.0',''),
                    "type": last_m["type"],
                    "date": "Жақында",
                    "p": last_m["percent"]
                })
    else:
        recent_grades = [
            {"subject": "Орыс тілі", "score": "10", "type": "ФО", "date": "25 наурыз", "p": 100},
            {"subject": "Математика", "score": "9", "type": "ФО", "date": "24 наурыз", "p": 90},
            {"subject": "Қазақ әдебиеті", "score": "14/15", "type": "БЖБ", "date": "23 наурыз", "p": 93},
            {"subject": "Физика", "score": "8", "type": "ФО", "date": "22 наурыз", "p": 80}
        ]

    return {
        "status": "success",
        "news": MOCK_NEWS,
        "recent_grades": recent_grades[:5]
    }

# ==========================================
# 3. ПОЛУЧЕНИЕ ОЦЕНОК И РАСЧЕТ БОЛЖАМ
# ==========================================
@app.get("/api/v1/grades/quarter")
async def get_quarter_grades(period: int = Query(1)):
    if SESSION["user_id"] and SESSION["user_id"].startswith("s"):
        table = list(MOCK_GRADES_DB[SESSION["user_id"]].values())
        for subject in table:
            for m_type, key in [('ФО', 'percent_fb'), ('БЖБ', 'percent_bjb'), ('ТЖБ', 'percent_tjb')]:
                cat_marks = [m['percent'] for m in subject['marks'] if m['type'] == m_type]
                if cat_marks:
                    avg = sum(cat_marks) / len(cat_marks)
                    subject[key] = f"{int(avg)}%" if avg.is_integer() else f"{round(avg, 1)}%"
        return {"status": "success", "table": table}

    if not SESSION["token"] or not SESSION["chat_token"]:
        raise HTTPException(status_code=403, detail="Авторизациядан өтіңіз!")

    headers_main = {
        'authorization': f'Bearer {SESSION["token"]}',
        'x-school-id': str(SESSION["school_id"])
    }

    headers_journal = {
        'accept': 'application/json',
        'authorization': f'Bearer {SESSION["chat_token"]}',
        'external': '1',
        'origin': 'https://www.bilimclass.kz',
        'user-agent': 'Mozilla/5.0',
        'x-school-id': str(SESSION["school_id"])
    }

    try:
        res_sub = requests.get('https://api.bilimclass.kz/api/v4/os/clientoffice/diary/subjects',
            headers=headers_main, params={
                "schoolId": SESSION["school_id"],
                "eduYear": SESSION["edu_year"],
                "period": period,
                "periodType": "quarter",
                "groupId": SESSION["group_id"]
            })

        dates = {
            1: ("2025-09-01T00:00:00.000Z", "2025-10-31T00:00:00.000Z"),
            2: ("2025-11-01T00:00:00.000Z", "2025-12-31T00:00:00.000Z"),
            3: ("2026-01-01T00:00:00.000Z", "2026-03-31T00:00:00.000Z"),
            4: ("2026-04-01T00:00:00.000Z", "2026-05-31T00:00:00.000Z"),
        }
        dateFrom, dateTo = dates.get(period, dates[1])

        res_marks = requests.get('https://journal-service.bilimclass.kz/diary/quarter',
            headers=headers_journal, params={
                "schoolId": SESSION["school_id"],
                "eduYear": SESSION["edu_year"],
                "userId": SESSION["user_id"],
                "studentGroupUuid": SESSION["group_uuid"],
                "dateFrom": dateFrom,
                "dateTo": dateTo
            })

        sub_data = res_sub.json().get('data', []) if res_sub.status_code == 200 else []
        marks_data = res_marks.json().get('data', {}) if res_marks.status_code == 200 else {}

        table = {}
        for s in sub_data:
            sid = str(s.get('subjectId'))
            table[sid] = {
                "subject_name": s.get('subjectName', '').strip(),
                "marks": [],
                "percent_fb": '-', "percent_bjb": '-', "percent_tjb": '-', "finalGrade": 3
            }

        for l_uuid, info in marks_data.items():
            for cat, m_type in [('formattedScore', 'ФО'), ('sor', 'БЖБ'), ('soch', 'ТЖБ')]:
                m_info = info.get(cat)
                if m_info and isinstance(m_info, dict) and m_info.get('mark') is not None:
                    sid = str(m_info.get('subjectId'))
                    if sid in table:
                        val = m_info.get('mark')
                        mmax = m_info.get('markMax')
                        p = (float(val) / float(mmax) * 100) if mmax and float(mmax) > 0 else 0
                        table[sid]["marks"].append({
                            "val": f"{val}/{mmax}" if mmax else str(val),
                            "raw_val": float(val),
                            "max": float(mmax) if mmax else float(val),
                            "percent": round(p, 1),
                            "type": m_type
                        })

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

# ==========================================
# 4. МАРШРУТЫ ДЛЯ ПОРТФОЛИО (ПРОЕКТЫ)
# ==========================================
class ProjectPayload(BaseModel):
    title: str
    description: str
    link1: str = ""
    link2: str = ""

@app.get("/api/v1/portfolio/projects")
async def get_portfolio_projects():
    uid = SESSION["user_id"]
    if not uid: return {"status": "error", "projects": []}
    return {"status": "success", "projects": PORTFOLIO_DB.get(uid, [])}

@app.post("/api/v1/portfolio/add_project")
async def add_portfolio_project(req: ProjectPayload):
    uid = SESSION["user_id"]
    if not uid: raise HTTPException(status_code=401)

    new_project = {
        "id": len(PORTFOLIO_DB[uid]) + 1,
        "title": req.title,
        "description": req.description,
        "link1": req.link1,
        "link2": req.link2
    }
    PORTFOLIO_DB[uid].insert(0, new_project)
    return {"status": "success"}

# ==========================================
# 5. МАРШРУТЫ ДЛЯ ПОРТФОЛИО (НАВЫКИ)
# ==========================================
@app.get("/api/v1/portfolio/skills")
async def get_skills():
    uid = SESSION["user_id"]
    if not uid: return {"status": "error", "skills": []}
    return {"status": "success", "skills": SKILLS_DB.get(uid, [])}

@app.post("/api/v1/portfolio/add_skill")
async def add_skill(skill: str = Query(...)):
    uid = SESSION["user_id"]
    if not uid: raise HTTPException(status_code=401)
    if skill not in SKILLS_DB[uid]:
        SKILLS_DB[uid].append(skill)
    return {"status": "success", "skills": SKILLS_DB[uid]}

@app.delete("/api/v1/portfolio/remove_skill")
async def remove_skill(skill: str = Query(...)):
    uid = SESSION["user_id"]
    if uid in SKILLS_DB and skill in SKILLS_DB[uid]:
        SKILLS_DB[uid].remove(skill)
    return {"status": "success"}

# ==========================================
# 6. ЭНДПОИНТ ДЛЯ AI-ГЕНЕРАТОРА НОВОСТЕЙ
# ==========================================
class AddNewsPayload(BaseModel):
    title: str
    description: str
    image_url: str

@app.post("/api/v1/ai/add_news")
async def ai_add_news(req: AddNewsPayload):
    new_item = {
        "id": len(MOCK_NEWS) + 1,
        "title": f"✨ AI: {req.title}",
        "date": "Жаңа (Авто)",
        "description": req.description,
        "image": req.image_url or "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop"
    }
    MOCK_NEWS.insert(0, new_item)
    return {"status": "success"}