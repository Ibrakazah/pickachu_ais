import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib

def train_custom_model():
    # 1. Загружаем твои реальные данные
    try:
        data = pd.read_csv('train_data.csv')
        print("✅ Данные загружены!")
    except:
        print("❌ Файл train_data.csv не найден. Создай его в Excel!")
        return

    # 2. Разделяем на "Вход" (ФО, СОР) и "Ответ" (СОЧ)
    X = data[['fo_avg', 'sor']]
    y = data['soch_final']

    # 3. Создаем модель и обучаем её (заточка)
    # n_estimators=500 делает её более внимательной к деталям
    model = RandomForestRegressor(n_estimators=500, random_state=42)
    model.fit(X, y)

    # 4. Сохраняем новые, заточенные мозги
    joblib.dump(model, 'student_model.pkl')
    print("🚀 Нейронка успешно заточена под ваши данные и сохранена в student_model.pkl!")

if __name__ == "__main__":
    train_custom_model()