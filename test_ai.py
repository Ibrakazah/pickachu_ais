from student_brain import StudentAI
from ai_scheduler import SmartScheduler


brain = StudentAI()
scheduler = SmartScheduler(brain)
student_marks = {
    "Математика": {"fo": [80, 75, 90], "sor": 40},  
    "Физика": {"fo": [95, 100], "sor": 95},      
    "Химия": {"fo": [60, 55], "sor": 35},        
    "Информатика": {"fo": [85, 90], "sor": 80}     
}

print("=== ЗАПУСК КОМПЛЕКСНОЙ ПРОВЕРКИ СИСТЕМЫ ===\n")


print("--- ЧАСТЬ 1: ПРОВЕРКА НЕЙРОНКИ ---")
res = brain.predict([80, 75], 40, "Математика", 11)
print(f"Результат мозга: {res['ai_advice']}\n")


print("--- ЧАСТЬ 2: УМНОЕ РАСПИСАНИЕ (Priority-based) ---")
final_schedule = scheduler.generate(11, student_marks)

for lesson in final_schedule:
    print(f"{lesson['time']} | {lesson['subject']} ({lesson['label']})")
   
    if "🔥" in lesson['label']:
        print(f"   👉 СОВЕТ: {lesson['info']}")
    print("-" * 30)

print("\n✅ Тест завершен успешно. Система готова к интеграции!")