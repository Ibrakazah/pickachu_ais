import pandas as pd
import numpy as np

def generate_big_data(rows=600):
    data = []
    for _ in range(rows):
       
        fo = np.random.randint(30, 101)
        
    
        sor = fo + np.random.randint(-20, 10)
        sor = max(0, min(100, sor))
        
       
        luck_factor = np.random.normal(0, 5) 
        soch = int(0.3 * fo + 0.7 * sor + luck_factor)
        
        if np.random.random() < 0.05: 
            soch += 20
            
        soch = max(0, min(100, soch))
        data.append([fo, sor, soch])
    
    df = pd.DataFrame(data, columns=['fo_avg', 'sor', 'soch_final'])
    df.to_csv('train_data.csv', index=False)
    print(f"✅ Создан мощный датасет: train_data.csv ({rows} строк)")

if __name__ == "__main__":
    generate_big_data()