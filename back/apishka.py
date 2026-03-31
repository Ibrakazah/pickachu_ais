from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import requests
import sqlite3
import os
from contextvars import ContextVar
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
import uuid

def init_db():
    conn = sqlite3.connect("shadow_diary.db")
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS local_grades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teacher_name TEXT,
            student_id TEXT,
            subject TEXT,
            grade INTEGER,
            comment TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            synced BOOLEAN DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()

init_db()

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
    "student1": {"password": "123", "role": "student", "name": "Алиев Арман", "class_name": "10 A", "id": "s1", "child_id": None},
    "student2": {"password": "123", "role": "student", "name": "Бекова Аяжан", "class_name": "9 A", "id": "s2", "child_id": None},
    "student3": {"password": "123", "role": "student", "name": "Ким Денис", "class_name": "9 B", "id": "s3", "child_id": None},
    "student4": {"password": "123", "role": "student", "name": "Оспанова Мадина", "class_name": "10 B", "id": "s4", "child_id": None},
    "admin1": {"password": "123", "role": "admin", "name": "Жумабеков Кайрат", "id": "a1"},
    "parent1": {"password": "123", "role": "parent", "name": "Жанар Алиева", "id": "p1", "child_id": "s1"},
    "teacher1": {"password": "123", "role": "teacher", "name": "Смагулов Б.", "id": "t1"},
}

# 2. Фейковые новости
MOCK_NEWS = [
    {
        "id": 1,
        "title": "AIS Хакатоны басталды!",
        "date": "28 наурыз - 30 наурыз",
        "description": "Мектебімізде жыл сайынғы IT хакатоны басталды. Барлық қатысушыларға сәттілік!",
        "image": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1000&auto=format&fit=crop",
        "target": "all"
    },
    {
        "id": 2,
        "title": "Көктемгі демалыс",
        "date": "21 наурыз - 1 сәуір",
        "description": "Оқушылар үшін көктемгі демалыс күндері басталды.",
        "image": "https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=1000&auto=format&fit=crop",
        "target": "all"
    }
]

# 3. База данных мок-оценок
def generate_default_grades():
    import random
    subjects = ["Алгебра", "Геометрия", "Физика", "Орыс тілі", "Қазақ әдебиеті", "Ағылшын тілі"]
    db = {}
    for s_id in ["s1", "s2", "s3", "s4", "s5"]:
        student_table = {}
        # Diverse base grades for s1 specifically
        if s_id == "s1":
            base_grades = [9, 8, 5, 7, 10, 6]
        else:
            base_grades = [random.randint(4, 10) for _ in subjects]
            
        for i, subj in enumerate(subjects):
            val = base_grades[i]
            # Fake quarters progress (1st, 2nd, 3rd, 4th quarter)
            quarters = [
                max(3, min(10, val - random.randint(1, 3))),
                max(3, min(10, val - random.randint(-1, 2))),
                max(3, min(10, val - random.randint(-1, 1))),
                val
            ]
            student_table[str(i)] = {
                "subject_name": subj,
                "marks": [
                    {"val": f"{val}/10", "raw_val": float(val), "max": 10.0, "percent": float(val*10), "type": "ФО", "quarter": 1},
                    {"val": f"{max(3,val-1)}/10", "raw_val": float(max(3,val-1)), "max": 10.0, "percent": float(max(3,val-1)*10), "type": "ФО", "quarter": 2},
                    {"val": f"{val}/10", "raw_val": float(val), "max": 10.0, "percent": float(val*10), "type": "СОЧ", "quarter": 2},
                    {"val": f"{max(3,val-1)}/10", "raw_val": float(max(3,val-1)), "max": 10.0, "percent": float(max(3,val-1)*10), "type": "СОР", "quarter": 3},
                    {"val": f"{val}/10", "raw_val": float(val), "max": 10.0, "percent": float(val*10), "type": "ФО", "quarter": 4}
                ],
                "quarters": quarters,
                "percent_fb": "-", "percent_bjb": "-", "percent_tjb": "-", "finalGrade": 3
            }
        db[s_id] = student_table
    return db

MOCK_GRADES_DB = generate_default_grades()

# 4. База данных для портфолио (ПРОЕКТЫ) - ПУСТАЯ изначально
PORTFOLIO_DB = { user["id"]: [] for user in MOCK_USERS.values() }

# 5. База данных для портфолио (НАВЫКИ) - ПУСТАЯ изначально
SKILLS_DB = { user["id"]: [] for user in MOCK_USERS.values() }

# 6. БАЗА ДАННЫХ РАСПИСАНИЯ
CLASSES_SCHEDULE_RAW = {
    "9 A": {
        "Monday": ["Math", "Kazakh", "English", "Physics", "History", "ICT"],
        "Tuesday": ["Biology", "Math", "Chemistry", "English", "Physical Education", "Geography"],
        "Wednesday": ["Global Perspectives", "Math", "Kazakh", "Russian", "Physics", "History"],
        "Thursday": ["Chemistry", "Biology", "English", "Math", "Art", "ICT"],
        "Friday": ["Physical Education", "Kazakh", "History", "Geography", "Math", "Self-Knowledge"]
    },
    "9 B": {
        "Monday": ["English", "Math", "Kazakh", "ICT", "Physics", "History"],
        "Tuesday": ["Math", "Biology", "English", "Chemistry", "Geography", "Physical Education"],
        "Wednesday": ["Russian", "Kazakh", "Global Perspectives", "Math", "History", "Physics"],
        "Thursday": ["Biology", "Chemistry", "Math", "English", "ICT", "Art"],
        "Friday": ["Kazakh", "Geography", "Physical Education", "Russian", "Self-Knowledge", "Math"]
    },
    "10 A": {
        "Monday": ["Physics", "English", "Calculus", "Computer Science", "Kazakh", "History"],
        "Tuesday": ["Chemistry", "Biology", "Calculus", "English", "Global Perspectives", "Physical Education"],
        "Wednesday": ["Geography", "Russian", "Physics", "Kazakh", "Calculus", "Economics"],
        "Thursday": ["Biology", "English", "Chemistry", "History", "Calculus", "Computer Science"],
        "Friday": ["Kazakh", "Physical Education", "Calculus", "Russian", "Economics", "Global Perspectives"]
    },
    "10 B": {
        "Monday": ["Computer Science", "Physics", "English", "Calculus", "History", "Kazakh"],
        "Tuesday": ["English", "Chemistry", "Biology", "Calculus", "Physical Education", "Global Perspectives"],
        "Wednesday": ["Russian", "Physics", "Kazakh", "Economics", "Geography", "Calculus"],
        "Thursday": ["English", "Biology", "History", "Chemistry", "Computer Science", "Calculus"],
        "Friday": ["Physical Education", "Kazakh", "Russian", "Calculus", "Global Perspectives", "Economics"]
    }
}

TEACHERS_MAP = {
    "Math": "Смагулов Б.", "Kazakh": "Абдикаримова А.", "English": "Иванова О.", 
    "Physics": "Асанов М.", "History": "Кенжебаев Д.", "ICT": "Серикбол Ж.",
    "Biology": "Алиева С.", "Chemistry": "Нуртаев К.", "Physical Education": "Алдияр Т.",
    "Geography": "Сапарова Л.", "Russian": "Мурзабаева А.", "Global Perspectives": "Смит Д.",
    "Art": "Ахметова Ж.", "Self-Knowledge": "Ермеков Н.", "Calculus": "Смагулов Б.",
    "Computer Science": "Серикбол Ж.", "Economics": "Оспанов Т."
}

# Для языковых предметов - второй учитель (подгруппа)
SUBGROUP_TEACHERS = {
    "Kazakh":  "Нұрланова Б.",
    "English": "Смит Д.",
}
SUBGROUP_ROOMS = ["101", "205", "201", "305", "102", "301"]
TIMESLOTS = ["08:30 - 09:15", "09:25 - 10:10", "10:30 - 11:15", "11:25 - 12:10", "12:20 - 13:05", "13:15 - 14:00"]
ROOMS = ["101", "102", "201", "205", "301", "305"]

def generate_schedule_db():
    db = {"Monday": [], "Tuesday": [], "Wednesday": [], "Thursday": [], "Friday": []}
    for cls, days in CLASSES_SCHEDULE_RAW.items():
        for day, subjects in days.items():
            room_idx = 0
            for i, subj in enumerate(subjects):
                timeslot = TIMESLOTS[i] if i < len(TIMESLOTS) else "15:00 - 15:45"
                main_teacher = TEACHERS_MAP.get(subj, "Мұғалім анықталмаған")
                
                # Language subjects — split into 2 subgroups with slash notation
                if subj in SUBGROUP_TEACHERS:
                    room1 = SUBGROUP_ROOMS[room_idx % len(SUBGROUP_ROOMS)]
                    room2 = SUBGROUP_ROOMS[(room_idx + 1) % len(SUBGROUP_ROOMS)]
                    if room1 == room2:
                        room2 = SUBGROUP_ROOMS[(room_idx + 2) % len(SUBGROUP_ROOMS)]
                    teacher2 = SUBGROUP_TEACHERS[subj]
                    db[day].append({
                        "time": timeslot,
                        "subject": subj,
                        "teacher": f"{main_teacher} / {teacher2}",
                        "room": f"{room1} / {room2}",
                        "class": cls
                    })
                    room_idx += 2
                else:
                    room = ROOMS[room_idx % len(ROOMS)]
                    db[day].append({
                        "time": timeslot,
                        "subject": subj,
                        "teacher": main_teacher,
                        "room": room,
                        "class": cls
                    })
                    room_idx += 1
    return db

SCHEDULE_DB = generate_schedule_db()

# 7. ГЕЙМИФИКАЦИЯ
ACHIEVEMENTS_DB = {
    "s1": [{"id": 1, "name": "Математик", "icon": "📐", "desc": "10/10 за контрольную"}],
}
LEADERBOARD = [
    {"name": "Алиев Арман", "points": 1250, "rank": 1},
    {"name": "Бекова Аяжан", "points": 1100, "rank": 2},
    {"name": "Ким Денис", "points": 980, "rank": 3},
]

SESSIONS_DB = {}
request_session = ContextVar("request_session", default={})

class SessionProxy:
    def __getitem__(self, key):
        return request_session.get().get(key)
    def __setitem__(self, key, value):
        request_session.get()[key] = value
    def get(self, key, default=None):
        return request_session.get().get(key, default)
    def __contains__(self, item):
        return item in request_session.get()

SESSION = SessionProxy()

class SessionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        auth = request.headers.get("Authorization")
        sess = {}
        if auth and auth.startswith("Bearer "):
            token = auth.split(" ")[1]
            if token in SESSIONS_DB:
                # Need to copy to prevent cross-request pollution if modified
                sess = SESSIONS_DB[token].copy()
        request_session.set(sess)
        response = await call_next(request)
        # Optionally, save it back if it got modified during request
        if auth and auth.startswith("Bearer "):
            token = auth.split(" ")[1]
            if token in SESSIONS_DB:
                SESSIONS_DB[token].update(request_session.get())
        return response

app.add_middleware(SessionMiddleware)

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
        new_token = f"mock_{user['id']}_{uuid.uuid4().hex[:6]}"
        SESSION["token"] = new_token
        SESSION["chat_token"] = "mock_chat"
        SESSION["user_id"] = user["id"]
        SESSION["student_name"] = user["name"]
        SESSION["class_name"] = user.get("class_name", "")
        SESSION["subgroup"] = "1-группа"
        SESSION["role"] = user["role"]
        SESSION["child_id"] = user.get("child_id")
        
        # Save to DB
        SESSIONS_DB[new_token] = request_session.get()

        print(f"🚀 МОК ВХОД: {user['name']} (Роль: {user['role']})")
        return {
            "status": "success",
            "token": new_token,
            "student_name": SESSION["student_name"],
            "class_name": SESSION["class_name"] or "Админ/Родитель",
            "subgroup": SESSION["subgroup"] or "Штаб",
            "role": SESSION["role"],
            "id": SESSION["user_id"],
            "child_id": SESSION["child_id"]
        }

    # ЕСЛИ НЕ МОК - ОБРАЩАЕМСЯ К BILIMCLASS
    auth_res = requests.post('https://api.bilimclass.kz/api/v2/os/login', json={
        "eduYear": 2025,
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
    real_token = auth_data.get('access_token')
    SESSION["token"] = real_token
    SESSION["school_id"] = user_info.get('school_id')
    SESSION["group_id"] = group_info.get('id')
    SESSION["student_name"] = f"{user_info.get('firstname')} {user_info.get('surname')}"
    SESSION["chat_token"] = user_info.get('chatToken')
    SESSION["user_id"] = str(user_info.get('userId') or user_info.get('id'))
    SESSION["group_uuid"] = student_info.get('studentGroupUuid')
    SESSION["edu_year"] = 2025

    # ВЫТАСКИВАЕМ КЛАСС И ПОДГРУППУ
    SESSION["class_name"] = group_info.get('name', 'Не указан')
    SESSION["subgroup"] = student_info.get('subGroupName') or "Общая группа"
    SESSION["role"] = "student"

    # Инициализируем БД для нового пользователя, если его нет
    uid = SESSION["user_id"]
    if uid not in PORTFOLIO_DB: PORTFOLIO_DB[uid] = []
    if uid not in SKILLS_DB: SKILLS_DB[uid] = []
    
    # Save to DB
    if real_token:
        SESSIONS_DB[real_token] = request_session.get()

    print(f"✅ ВХОД (BilimClass): {SESSION['student_name']} | Класс: {SESSION['class_name']} | Группа: {SESSION['subgroup']}")

    return {
        "status": "success",
        "token": real_token,
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

    user_class = SESSION.get("class_name", "") or ""
    filtered_news = []
    for n in MOCK_NEWS:
        target = n.get("target", "all")
        if target == "all":
            filtered_news.append(n)
        elif target == user_class:
            filtered_news.append(n)
        elif "сыныптар" in target.lower():
            # Если целевая аудитория "10-сыныптар" и юзер в "10 A"
            parallel = target.split('-')[0]
            if str(user_class).startswith(parallel):
                filtered_news.append(n)

    return {
        "status": "success",
        "news": filtered_news,
        "recent_grades": recent_grades[:5]
    }

# ==========================================
# 3. ПОЛУЧЕНИЕ ОЦЕНОК И РАСЧЕТ БОЛЖАМ
# ==========================================
@app.get("/api/v1/grades/quarter")
async def get_quarter_grades(period: int = Query(1)):
    if SESSION["user_id"] and SESSION["user_id"].startswith("s"):
        raw_table = list(MOCK_GRADES_DB[SESSION["user_id"]].values())
        table = []
        for subject in raw_table:
            # Фильтруем оценки только по выбранной четверти
            quarter_marks = [m for m in subject.get("marks", []) if m.get("quarter") == period]
            subj_copy = dict(subject)
            subj_copy["marks"] = quarter_marks

            # Пересчитываем проценты по типам для этой четверти
            for m_type, key in [('ФО', 'percent_fb'), ('СОЧ', 'percent_bjb'), ('СОР', 'percent_tjb')]:
                cat_marks = [m['percent'] for m in quarter_marks if m['type'] == m_type]
                if cat_marks:
                    avg = sum(cat_marks) / len(cat_marks)
                    subj_copy[key] = f"{int(avg)}%" if float(avg).is_integer() else f"{round(avg, 1)}%"
                else:
                    subj_copy[key] = "-"

            # Оценка четверти из массива quarters
            quarters = subject.get("quarters", [None, None, None, None])
            quarter_grade = quarters[period - 1] if len(quarters) >= period else None
            subj_copy["quarter_grade"] = quarter_grade

            table.append(subj_copy)
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
    if uid not in PORTFOLIO_DB: PORTFOLIO_DB[uid] = []

    new_project = {
        "id": len(PORTFOLIO_DB[uid]) + 1,
        "title": req.title,
        "description": req.description,
        "link1": req.link1,
        "link2": req.link2
    }
    PORTFOLIO_DB[uid].insert(0, new_project)
    return {"status": "success"}

@app.delete("/api/v1/portfolio/remove_project")
async def remove_portfolio_project(project_id: int):
    uid = SESSION["user_id"]
    if not uid or uid not in PORTFOLIO_DB: 
        return {"status": "error"}
    
    PORTFOLIO_DB[uid] = [p for p in PORTFOLIO_DB[uid] if p["id"] != project_id]
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
    if uid not in SKILLS_DB: SKILLS_DB[uid] = []
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

# ==========================================
# 7. SMART SCHEDULE (HARDCORE)
# ==========================================
@app.get("/api/v1/schedule")
async def get_schedule(class_name: Optional[str] = None):
    cls = class_name or SESSION.get("class_name", "10 A")
    filtered = {}
    for day, lessons in SCHEDULE_DB.items():
        filtered_lessons = [l for l in lessons if l["class"] == cls]
        if filtered_lessons:
            filtered[day] = filtered_lessons
    return {"status": "success", "schedule": filtered}

class SickTeacher(BaseModel):
    name: str
    day: str

class GenerateSchedulePayload(BaseModel):
    available_rooms: str = "101, 102, 201, 202, 301, 305"
    sick_teachers: List[SickTeacher] = []
    use_gemini: bool = True

# GEMINI API KEY
GEMINI_API_KEY = "AIzaSyBtMYbahySNf8L4RmY2_dF1u1P2E4jEphc"
@app.post("/api/v1/schedule/generate")
async def generate_schedule(req: GenerateSchedulePayload):
    import requests, json
    
    global SCHEDULE_DB
    
    sick_info = [{"name": st.name, "day": st.day} for st in req.sick_teachers]
    
    prompt = f"""
    You are an expert school scheduler. Generate a JSON schedule for 4 classes: "9 A", "9 B", "10 A", "10 B".
    Days: "Monday", "Tuesday", "Wednesday", "Thursday", "Friday".
    Timeslots per day: 5 or 6 timeslots (e.g., "08:30 - 09:15", "09:25 - 10:10", etc.).
    
    Constraint 1: You MUST ONLY use the following room numbers: {req.available_rooms}. Do not invent any other rooms!
    Constraint 2: The following teachers are sick and CANNOT have ANY classes on the specified day: {sick_info if req.sick_teachers else "None sick"}
    Constraint 3: Subjects "Kazakh" and "English" are divided into subgroups! To do this correctly, a subgrouped lesson must occupy EXACTLY 2 of the available rooms and 2 different teachers at the same time. HOWEVER, you MUST format this as a SINGLE JSON object in the array, joining the two rooms and two teachers with a ' / '. This satisfies both the dual-resource restriction and the frontend display format. 
    Example valid output for English in 10 A: {{"time": "08:30", "subject": "English", "teacher": "Teacher1 / Teacher2", "room": "101 / 202", "class": "10 A"}}.
    
    Available subjects and main teachers map: {TEACHERS_MAP}
    
    Your output MUST be a valid JSON object WITH NO MARKDOWN syntax (do not wrap in ```json ... ```) with this exact structure:
    {{
        "Monday": [
            {{"time": "08:30", "subject": "Math", "teacher": "Смагулов Б.", "room": "101", "class": "10 A"}},
            {{"time": "08:30", "subject": "English", "teacher": "Иванова О. / Смит Д.", "room": "102 / 103", "class": "9 B"}}
        ],
        ...
    }}
    Ensure the JSON is complete and valid.
    """

    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.2
        }
    }
    
    try:
        resp = requests.post(api_url, json=payload, headers={"Content-Type": "application/json"})
        if resp.status_code != 200:
            return {"status": "error", "message": f"Gemini API Қате: {resp.text[:200]}"}
            
        data = resp.json()
        ai_text = data["candidates"][0]["content"]["parts"][0]["text"]
        new_schedule = json.loads(ai_text)
        
        # Validation mapping if keys differ slightly (like "monday" instead of "Monday")
        validated_schedule = {}
        day_map = {d.lower(): d for d in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}
        for d_key, lessons in new_schedule.items():
            valid_d = day_map.get(d_key.lower())
            if valid_d:
                validated_schedule[valid_d] = lessons
                
        if not validated_schedule:
            return {"status": "error", "message": "ИИ бос тақтаны қайтарды (Пустой ответ ИИ)."}
            
        SCHEDULE_DB = validated_schedule
        return {"status": "success", "message": "ИИ Gemini кестені сәтті құрастырды!"}
    except Exception as e:
        print("ERROR GEMINI:", e)
        return {"status": "error", "message": f"Қате (Ошибка): {str(e)}"}

# ==========================================
# 8. AI ANALYTICS & EARLY WARNING
# ==========================================
@app.get("/api/v1/ai/student_prediction")
async def get_student_prediction(uid: str):
    return {
        "status": "success",
        "risk_level": "medium",
        "prob_fail": 65,
        "topic": "Физика (Кинематика)",
        "recommendation": "С вероятностью 65% ты можешь получить оценку ниже ожидаемой по Физике из-за пробелов в теме 'Законы Ньютона'.",
        "resources": [
            {"title": "Видео: Законы Ньютона для начинающих", "url": "#"},
            {"title": "Тест для самопроверки", "url": "#"}
        ],
        "knowledge_graph": {
            "Algebra": 85, "Physics": 45, "History": 90, "Languages": 75
        }
    }

@app.get("/api/v1/teacher/early_warning")
async def get_early_warning(subjects: str = Query(default=None)):
    """
    subjects: опциональный фильтр — предметы учителя через запятую.
    Если не задан — возвращает все (для админа).
    """
    def calc_bolzham(marks):
        def avg(t):
            ms = [m["percent"] for m in marks if m.get("type") == t]
            return sum(ms) / len(ms) if ms else None
        fo, soch, sor = avg("ФО"), avg("СОЧ"), avg("СОР")
        fo_sor = (fo + sor) / 2 if fo is not None and sor is not None else (fo or sor or 0)
        if soch is not None:
            return round(soch * 0.5 + fo_sor * 0.5, 1)
        return round(fo_sor, 1)

    # Нормализуем фильтр предметов
    # Нормализуем фильтр предметов
    # Учитель получает предметы из РАСПИСАНИЯ (на англ.), а оценки хранятся на рус/каз
    SUBJECT_ALIASES = {
        "math":              ["алгебра", "геометрия", "математика"],
        "calculus":          ["алгебра", "геометрия", "математика"],
        "algebra":           ["алгебра"],
        "geometry":          ["геометрия"],
        "physics":           ["физика"],
        "chemistry":         ["химия"],
        "biology":           ["биология"],
        "history":           ["история", "тарих"],
        "geography":         ["география", "жағрафия"],
        "english":           ["ағылшын тілі", "английский язык"],
        "russian":           ["орыс тілі", "русский язык"],
        "kazakh":            ["қазақ тілі", "казахский язык", "қазақ әдебиеті"],
        "ict":               ["информатика", "computer science"],
        "computer science":  ["информатика", "ict"],
        "physical education":["дене шынықтыру", "физкультура"],
        "global perspectives":["дүниетану"],
        "economics":         ["экономика"],
        "art":               ["бейнелеу өнері", "изобразительное искусство"],
        "self-knowledge":    ["өзін-өзі тану"],
    }

    filter_subjects = None
    if subjects:
        raw_filters = [s.strip().lower() for s in subjects.split(",") if s.strip()]
        expanded = set()
        for rf in raw_filters:
            expanded.add(rf)
            if rf in SUBJECT_ALIASES:
                expanded.update(SUBJECT_ALIASES[rf])
        filter_subjects = list(expanded)

    students_info = {
        "s1": {"name": "Алиев Арман",     "class": "10 A"},
        "s2": {"name": "Бекова Аяжан",    "class": "9 A"},
        "s3": {"name": "Ким Денис",        "class": "9 B"},
        "s4": {"name": "Оспанова Мадина", "class": "10 B"},
    }

    risky_students = []
    class_stats = {}

    for sid, info in students_info.items():
        grades = MOCK_GRADES_DB.get(sid, {})
        cls = info["class"]
        if cls not in class_stats:
            class_stats[cls] = {"bolzhams": [], "count": 0}
        class_stats[cls]["count"] += 1

        student_issues = []
        all_bolzhams = []

        for subj_data in grades.values():
            subj_name = subj_data["subject_name"]
            marks = subj_data.get("marks", [])
            quarters_raw = subj_data.get("quarters", [None, None, None, None])

            # Болжам всегда считаем по всем предметам для общего показателя
            bolzham_all = calc_bolzham(marks)
            all_bolzhams.append(bolzham_all)

            # Фильтрация по предметам учителя (если задан)
            if filter_subjects and subj_name.lower() not in filter_subjects:
                continue

            # Тренд по четвертям
            q_vals = [q for q in quarters_raw if q is not None]
            trend = []
            if len(q_vals) >= 2:
                for i in range(len(q_vals)):
                    trend.append(round(q_vals[i] * 10, 1))

            # Падение: последний vs среднее предыдущих
            drop_pct = 0
            if len(q_vals) >= 2:
                prev_avg = sum(q_vals[:-1]) / len(q_vals[:-1])
                last = q_vals[-1]
                if prev_avg > 0:
                    drop_pct = round((prev_avg - last) / prev_avg * 100, 1)

            # Уровень риска по болжаму
            risk = None
            if bolzham_all < 50:
                risk = "high"
            elif bolzham_all < 65:
                risk = "medium"
            elif bolzham_all < 75:
                risk = "low"

            if risk or drop_pct > 15:
                student_issues.append({
                    "subject": subj_name,
                    "bolzham": bolzham_all,
                    "drop_percent": max(drop_pct, 0),
                    "risk": risk or "low",
                    "trend": trend,
                    "last_marks": [m["raw_val"] for m in marks[-3:]] if marks else []
                })

        overall_bolzham = round(sum(all_bolzhams) / len(all_bolzhams), 1) if all_bolzhams else 0
        class_stats[cls]["bolzhams"].append(overall_bolzham)

        if student_issues:
            # Сортируем по болжаму (худшие вперёд)
            student_issues.sort(key=lambda x: x["bolzham"])
            worst_risk = "high" if any(i["risk"] == "high" for i in student_issues) \
                         else ("medium" if any(i["risk"] == "medium" for i in student_issues) else "low")
            risky_students.append({
                "id": sid,
                "name": info["name"],
                "class": cls,
                "overall_bolzham": overall_bolzham,
                "risk_level": worst_risk,
                "issues": student_issues[:3],   # топ 3 проблемных предмета
                "issues_count": len(student_issues)
            })

    # Статистика по классам
    class_summary = []
    for cls, data in class_stats.items():
        avg_b = round(sum(data["bolzhams"]) / len(data["bolzhams"]), 1) if data["bolzhams"] else 0
        class_summary.append({
            "class": cls,
            "avg_bolzham": avg_b,
            "student_count": data["count"],
            "at_risk_count": sum(1 for s in risky_students if s["class"] == cls)
        })

    # Сортируем: сначала high risk
    order = {"high": 0, "medium": 1, "low": 2}
    risky_students.sort(key=lambda x: order.get(x["risk_level"], 3))

    return {
        "status": "success",
        "risky_students": risky_students,
        "class_summary": class_summary,
        "total_at_risk": len(risky_students)
    }


@app.get("/api/v1/ai/teacher_report")
async def get_ai_teacher_report():
    return {
        "status": "success",
        "report": "Отчет по 10 'А' классу: \nОбщая успеваемость стабильна (82%). \nПроблема: 3 ученика имеют задолженности по физике. \nРекомендация: провести доп. занятие в четверг."
    }

# ==========================================
# 9. GAMIFICATION & LEADERBOARD
# ==========================================
@app.get("/api/v1/gamification/data")
async def get_gamification_data(uid: str):
    return {
        "status": "success",
        "achievements": ACHIEVEMENTS_DB.get(uid, []),
        "leaderboard": LEADERBOARD,
        "current_rank": 1 if uid == "s1" else 5,
        "points": 1250 if uid == "s1" else 450
    }

class AdminNewsPayload(BaseModel):
    title: str
    description: str
    image_url: str = ""
    target: str = "all"

@app.post("/api/v1/admin/news")
async def add_admin_news(req: AdminNewsPayload):
    from datetime import datetime
    new_item = {
        "id": len(MOCK_NEWS) + 1,
        "title": req.title,
        "date": datetime.now().strftime("%d %B %Y"),
        "description": req.description,
        "image": req.image_url or "https://images.unsplash.com/photo-1584697964190-7cb03a746973?q=80&w=1000&auto=format&fit=crop",
        "target": req.target
    }
    MOCK_NEWS.insert(0, new_item)
    return {"status": "success", "message": "Жаңалық сәтті қосылды!", "news": MOCK_NEWS}

# ==========================================
# 10. ADMIN DASHBOARD (GLOBAL RADAR)
# ==========================================
@app.get("/api/v1/admin/radar")
async def get_global_radar():
    return {
        "status": "success",
        "parallels": [
            {"name": "9 Классы", "quality": 78, "attendance": 94},
            {"name": "10 Классы", "quality": 85, "attendance": 92},
            {"name": "11 Классы", "quality": 91, "attendance": 89}
        ]
    }

# ==========================================
# PARENT DASHBOARD: AI REPORT
# ==========================================
@app.get("/api/v1/parent/report")
async def get_parent_report():
    import requests
    
    child_id = SESSION.get("child_id")
    if not child_id:
        return {"status": "error", "message": "Нет привязанного ученика к этому родителю."}
        
    # Get grades for the child from MOCK_GRADES_DB
    student_grades = MOCK_GRADES_DB.get(child_id, {})
    if not student_grades:
        return {"status": "error", "message": "Оценки не найдены."}
        
    grades_list = []
    for _, grade_obj in student_grades.items():
        val = grade_obj["marks"][0]["raw_val"] if grade_obj["marks"] else 0
        grades_list.append({"subject": grade_obj["subject_name"], "score": val})
        
    grades_text = ", ".join([f"{g['subject']}: {g['score']}/10" for g in grades_list])
    
    # Calculate average score per quarter for the chart
    quarters_avg = []
    for q_idx in range(4):
        total = sum(grade_obj.get("quarters", [0,0,0,0])[q_idx] for grade_obj in student_grades.values())
        avg = round(total / len(student_grades), 1) if student_grades else 0
        quarters_avg.append({"quarter": f"{q_idx+1} Четверть", "score": avg})
    
    prompt = f"""
    Ты — вежливый и профессиональный школьный куратор. Проанализируй оценки ученика.
    Напиши для его родителей краткий мини-отчет (3-4 предложения). 
    Отметь сильные стороны (где хорошие оценки) и мягко укажи, на какие предметы стоит обратить внимание (где оценки падают). 
    Тон: поддерживающий, конструктивный, уважительный. Обращайся к родителю на 'Вы'.
    
    Вот текущие оценки ученика (из 10 возможных баллов):
    {grades_text}
    """
    
    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.4}
    }
    
    # Fallback text inside case of 429
    fallback_text = f"Здравствуйте! Я ваш ИИ-куратор (работаю в оффлайн-режиме из-за перегрузки серверов). Хотела бы отметить: ребенок показывает хорошие результаты, оценки стабильные ({grades_text}). Давайте продолжим мотивировать его к учёбе!"
    
    try:
        resp = requests.post(api_url, json=payload, headers={"Content-Type": "application/json"})
        if resp.status_code == 429:
            return {"status": "success", "grades": grades_list, "quarters_avg": quarters_avg, "ai_report": fallback_text}
        if resp.status_code != 200:
            return {"status": "error", "message": f"Gemini API Ошибка: {resp.status_code}"}
            
        data = resp.json()
        ai_text = data["candidates"][0]["content"]["parts"][0]["text"]
        return {"status": "success", "grades": grades_list, "quarters_avg": quarters_avg, "ai_report": ai_text.strip()}
    except Exception as e:
        return {"status": "success", "grades": grades_list, "quarters_avg": quarters_avg, "ai_report": fallback_text}

# ==========================================
# 12. ТЕНЕВОЙ ЖУРНАЛ (КАБИНЕТ УЧИТЕЛЯ)
# ==========================================
@app.get("/api/v1/teacher/my-schedule")
async def get_teacher_schedule():
    teacher_name = SESSION.get("student_name") # Since auth saves it as student_name
    if not teacher_name or SESSION.get("role") != "teacher":
        return {"status": "error", "message": "Доступ запрещен"}

    # Filter SCHEDULE_DB for the current teacher with exact 6 slots
    teacher_schedule = {day: [None]*6 for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}
    
    def get_slot_index(time_str):
        if "08:30" in time_str: return 0
        if "09:25" in time_str: return 1
        if "10:30" in time_str: return 2
        if "11:25" in time_str: return 3
        if "12:20" in time_str: return 4
        if "13:15" in time_str: return 5
        return -1
        
    for day, lessons in SCHEDULE_DB.items():
        for lesson in lessons:
            teachers_list = [t.strip() for t in lesson["teacher"].split("/")]
            if teacher_name in teachers_list:
                idx = get_slot_index(lesson["time"])
                if idx != -1:
                    teacher_schedule[day][idx] = lesson
                else:
                    # In case AI generated a weird time, just append it
                    teacher_schedule[day].append(lesson)
    return {"status": "success", "schedule": teacher_schedule}

@app.get("/api/v1/teacher/my-students")
async def get_teacher_students(class_name: str):
    if SESSION.get("role") != "teacher":
        return {"status": "error", "message": "Доступ запрещен"}
        
    students = []
    for uname, udata in MOCK_USERS.items():
        if udata["role"] == "student" and udata.get("class_name") == class_name:
            students.append({"id": udata["id"], "name": udata["name"], "username": uname})
    return {"status": "success", "students": students}

class AddGradePayload(BaseModel):
    student_id: str
    subject: str
    grade: int
    comment: str = ""
    quarter: int = 4          # 1, 2, 3, 4
    grade_type: str = "ФО"   # ФО | СОЧ | СОР

@app.get("/api/v1/teacher/student-grades")
async def get_student_grades_for_teacher(student_id: str, subject: str, quarter: int):
    """Возвращает оценки ученика по предмету за конкретную четверть."""
    if SESSION.get("role") != "teacher":
        return {"status": "error", "message": "Доступ запрещен"}
    
    subject_map = {
        "Math": "Алгебра", "Calculus": "Алгебра", "Physics": "Физика",
        "Russian": "Орыс тілі", "English": "Ағылшын тілі", "Kazakh": "Қазақ әдебиеті"
    }
    mapped_subject = subject_map.get(subject, subject)
    student_grades = MOCK_GRADES_DB.get(student_id, {})
    
    result = []
    for g_data in student_grades.values():
        if g_data["subject_name"] in [mapped_subject, subject]:
            for m in g_data["marks"]:
                if m.get("quarter") == quarter:
                    result.append(m)
    return {"status": "success", "marks": result}

@app.post("/api/v1/teacher/add-grade")
async def add_teacher_grade(req: AddGradePayload):
    teacher_name = SESSION.get("student_name")
    if SESSION.get("role") != "teacher":
        return {"status": "error", "message": "Доступ запрещен"}

    # Валидация типа оценки
    if req.grade_type not in ["ФО", "СОЧ", "СОР"]:
        return {"status": "error", "message": "Тип оценки должен быть ФО, СОЧ или СОР"}

    if req.quarter not in [1, 2, 3, 4]:
        return {"status": "error", "message": "Четверть должна быть от 1 до 4"}

    subject_map = {
        "Math": "Алгебра", "Calculus": "Алгебра", "Physics": "Физика",
        "Russian": "Орыс тілі", "English": "Ағылшын тілі", "Kazakh": "Қазақ әдебиеті"
    }
    mapped_subject = subject_map.get(req.subject, req.subject)

    try:
        student_grades = MOCK_GRADES_DB.get(req.student_id)
        if student_grades is not None:
            # Ищем предмет
            target_subj = None
            for idx, g_data in student_grades.items():
                if g_data["subject_name"] in [mapped_subject, req.subject]:
                    target_subj = g_data
                    break

            new_mark = {
                "val": f"{req.grade}/10",
                "raw_val": float(req.grade),
                "max": 10.0,
                "percent": float(req.grade * 10),
                "type": req.grade_type,
                "quarter": req.quarter
            }

            if target_subj is not None:
                # Если СОЧ — ищем существующий и обновляем, не дублируем
                if req.grade_type == "СОЧ":
                    existing_soch = next(
                        (m for m in target_subj["marks"]
                         if m.get("type") == "СОЧ" and m.get("quarter") == req.quarter),
                        None
                    )
                    if existing_soch:
                        # Обновляем на месте
                        existing_soch["val"] = new_mark["val"]
                        existing_soch["raw_val"] = new_mark["raw_val"]
                        existing_soch["percent"] = new_mark["percent"]
                    else:
                        target_subj["marks"].append(new_mark)
                else:
                    target_subj["marks"].append(new_mark)
                # Обновляем только выбранную четверть
                if "quarters" in target_subj:
                    target_subj["quarters"][req.quarter - 1] = req.grade
            else:
                # Создаём новую запись предмета
                quarters = [None, None, None, None]
                quarters[req.quarter - 1] = req.grade
                new_idx = str(len(student_grades))
                student_grades[new_idx] = {
                    "subject_name": mapped_subject,
                    "marks": [new_mark],
                    "quarters": quarters,
                    "percent_fb": "-", "percent_bjb": "-", "percent_tjb": "-", "finalGrade": 3
                }

        # Сохраняем в SQLite
        conn = sqlite3.connect("shadow_diary.db")
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO local_grades (teacher_name, student_id, subject, grade, comment) VALUES (?, ?, ?, ?, ?)",
            (teacher_name, req.student_id, req.subject, req.grade, f"[{req.grade_type}][Q{req.quarter}] {req.comment}")
        )
        conn.commit()
        conn.close()

        return {"status": "success", "message": f"{req.grade_type} за {req.quarter}-четверть успешно выставлен!"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

