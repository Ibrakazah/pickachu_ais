from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn


import student_brain
import ai_scheduler

app = FastAPI(title="Aqbobek AI Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Aqbobek AI Engine is running"}

@app.get("/api/predict")
async def get_ai_prediction(topic: str = "Алгебра"):
  
    fo_samples = [85, 90, 78]
    sor_samples = [65]
    
    advice = student_brain.get_ai_advice(fo_samples, sor_samples, topic)
    return {
        "topic": topic,
        "ai_advice": advice,
        "status": "analyzed"
    }


@app.get("/api/schedule")
async def get_smart_schedule():
    teachers = ["Ахметов А.", "Оспанов Б.", "Иванова В."]
    subjects = ["Математика", "Физика", "Английский", "Информатика"]
    rooms = ["101 каб", "102 каб", "Лаборатория", "205 каб"]

    ai_sh = ai_scheduler.AqbobekScheduler(teachers, subjects, rooms)
    result = ai_sh.generate(["10A", "10B"])
    return {"schedule": result}

if __name__ == "__main__":
   
    uvicorn.run(app, host="0.0.0.0", port=8000)