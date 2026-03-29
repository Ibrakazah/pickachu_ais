class SmartScheduler:
    def __init__(self, ai_engine):
        self.ai = ai_engine
        self.times = ["08:30", "09:25", "10:30", "11:25", "12:30"]

    def generate(self, grade, student_data):
        """
        student_data: { "Предмет": {"fo": [оценки], "sor": балл} }
        """
        analysis = []
        for subject, grades in student_data.items():
            res = self.ai.predict(grades["fo"], grades["sor"], subject, grade)
            analysis.append(res)

        
        analysis.sort(key=lambda x: x["priority"], reverse=True)

        schedule = []
        for i, time in enumerate(self.times):
            if i < len(analysis):
                item = analysis[i]
                is_urgent = item["priority"] > 40
                
                schedule.append({
                    "time": time,
                    "subject": item["subject"],
                    "label": "🔥 УСИЛЕННО" if is_urgent else "📘 СТАНДАРТ",
                    "info": item["ai_advice"]
                })
        
        return schedule