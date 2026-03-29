import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

class StudentAI:
    def __init__(self):
        self.model_path = 'student_model.pkl'
       
        self.knowledge_base = {
            "Математика": {
                "7": "повтори линейные функции и действия с многочленами",
                "9": "сосредоточься на тригонометрии острого угла и векторах",
                "11": "повтори производную, первообразную и комплексные числа"
            },
            "Физика": {
                "7": "закрепи формулы плотности и давления",
                "9": "повтори законы сохранения импульса и энергии",
                "11": "подтяни квантовую физику и теорию относительности"
            },
            "Информатика": {
                "7": "повтори алгоритмы и блок-схемы",
                "9": "закрепи циклы и массивы в Python",
                "11": "повтори базы данных и сетевые протоколы"
            },
            "Химия": {
                "7": "повтори таблицу Менделеева и валентность",
                "9": "изучи электролитическую диссоциацию",
                "11": "повтори органическую химию и реакции окисления"
            }
        }
        self.model = self._load_or_train()

    def _load_or_train(self):
        if os.path.exists(self.model_path):
            return joblib.load(self.model_path)
        else:
            print("🤖 Файл модели не найден. Обучаю новую модель...")
           
            data = []
            for _ in range(5000):
                fo = np.random.randint(30, 101)
                sor = max(0, min(101, fo + np.random.randint(-20, 10)))
                soch = int(0.3 * fo + 0.7 * sor + np.random.normal(0, 5))
                data.append([fo, sor, max(0, min(100, soch))])
            
            df = pd.DataFrame(data, columns=['fo_avg', 'sor', 'soch_final'])
            model = RandomForestRegressor(n_estimators=100, random_state=42)
            model.fit(df[['fo_avg', 'sor']], df['soch_final'])
            joblib.dump(model, self.model_path)
            return model

    def predict(self, fo_grades, sor_score, subject, grade):
        avg_fo = sum(fo_grades) / len(fo_grades)
        
        
        X_input = pd.DataFrame([[avg_fo, sor_score]], columns=['fo_avg', 'sor'])
        pred_score = self.model.predict(X_input)[0]
        
       
        subj_data = self.knowledge_base.get(subject, {})
        topic_advice = subj_data.get(str(grade), "повтори текущие темы раздела")
        
        if pred_score < 60:
            status, icon = "Критический риск", "🚨"
        elif pred_score < 85:
            status, icon = "Средний риск", "⚠️"
        else:
            status, icon = "Всё отлично", "✅"

        advice = f"{icon} {grade} класс, {subject}: Прогноз СОЧ {round(pred_score, 1)}%. Совет: {topic_advice}."

        return {
            "subject": subject,
            "predicted_soch": round(pred_score, 1),
            "status": status,
            "ai_advice": advice,
            "priority": 100 - pred_score 
        }