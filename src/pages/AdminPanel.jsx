import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';

const AdminPanel = () => {
    const [radarData, setRadarData] = useState([]);
    const [scheduleMsg, setScheduleMsg] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchRadar();
    }, []);

    const fetchRadar = async () => {
        const res = await axios.get('http://localhost:8000/api/v1/admin/radar');
        if (res.data.status === "success") {
            setRadarData(res.data.parallels);
        }
    };

    const generateSchedule = async () => {
        setLoading(true);
        const res = await axios.post('http://localhost:8000/api/v1/schedule/generate');
        if (res.data.status === "success") {
            setScheduleMsg(res.data.message);
            // Notify students (Mock push)
            alert("Пуш-уведомление: Расписание обновлено! (Для всех классов)");
        }
        setLoading(false);
    };

    return (
        <div className="admin-panel animate-fade-in">
            <header className="premium-header">
                <h1>Глобальный Радар Администрирования</h1>
                <p>Центр управления школьным порталом Aqbobek Lyceum</p>
            </header>

            <div className="radar-grid">
                <section className="radar-card">
                    <h2>📊 Качество образования (Параллели)</h2>
                    <div className="parallels-list">
                        {radarData.map(p => (
                            <div key={p.name} className="parallel-item">
                                <div className="parallel-header">
                                    <strong>{p.name}</strong>
                                    <span>Посещаемость: {p.attendance}%</span>
                                </div>
                                <div className="progress-bar-bg">
                                    <div className="progress-bar-fill" style={{width: `${p.quality}%`}}>
                                        <span className="p-val">{p.quality}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="control-card">
                    <h2>📅 Умное Расписание (Smart Schedule)</h2>
                    <p>Используйте AI-алгоритмы для генерации бесконфликтного расписания на основе доступности учителей и кабинетов.</p>
                    <div className="control-actions">
                        <button className="premium-btn primary" onClick={generateSchedule} disabled={loading}>
                            {loading ? "Генерация..." : "Авто-генерация расписания"}
                        </button>
                        <button className="premium-btn secondary" onClick={() => alert("Ручное редактирование...")}>
                            Редактировать ленты
                        </button>
                    </div>
                    {scheduleMsg && <div className="success-msg animate-pop-in">✅ {scheduleMsg}</div>}
                    
                    <div className="constraints-list">
                        <h3>Активные ограничения:</h3>
                        <ul>
                            <li>✔️ Группировка потоковых лекций (10 А, 10 B)</li>
                            <li>✔️ Учет "окон" учителей</li>
                            <li>✔️ Проверка наложения кабинетов</li>
                        </ul>
                    </div>
                </section>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .admin-panel { padding: 50px; background: #0f172a; min-height: 100vh; color: #f8fafc; font-family: 'Outfit', 'Inter', sans-serif; }
                .premium-header { border-bottom: 1px solid #334155; padding-bottom: 20px; margin-bottom: 40px; }
                .premium-header h1 { font-size: 2.8rem; background: linear-gradient(to right, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .premium-header p { color: #94a3b8; font-size: 1.1rem; }

                .radar-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
                .radar-card, .control-card { background: #1e293b; padding: 35px; border-radius: 28px; border: 1px solid #334155; }

                .parallels-list { display: flex; flex-direction: column; gap: 25px; margin-top: 30px; }
                .parallel-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 10px; }
                .parallel-header strong { font-size: 1.3rem; color: #e2e8f0; }
                .parallel-header span { font-size: 0.9rem; color: #64748b; }

                .progress-bar-bg { background: #0f172a; height: 12px; border-radius: 10px; overflow: hidden; position: relative; }
                .progress-bar-fill { height: 100%; background: linear-gradient(to right, #6366f1, #a855f7); border-radius: 10px; display: flex; align-items: center; justify-content: flex-end; transition: width 1s ease; }
                .p-val { font-size: 0.75rem; font-weight: bold; padding-right: 10px; color: white; margin-top: -30px; display: block; position: absolute; right: 0; }

                .control-actions { display: flex; gap: 15px; margin: 30px 0; }
                .premium-btn { border: none; padding: 18px 30px; border-radius: 14px; font-weight: bold; font-size: 1rem; cursor: pointer; transition: 0.3s; }
                .premium-btn.primary { background: #38bdf8; color: #0f172a; }
                .premium-btn.secondary { background: #334155; color: #cbd5e1; }
                .premium-btn:hover { filter: brightness(1.1); transform: scale(1.02); }

                .success-msg { background: #064e3b; color: #34d399; padding: 15px; border-radius: 12px; border-left: 5px solid #10b981; margin: 20px 0; font-weight: 500; }
                .constraints-list { margin-top: 40px; }
                .constraints-list ul { list-style: none; padding: 0; margin-top: 15px; }
                .constraints-list li { padding: 10px 0; color: #94a3b8; font-size: 0.95rem; border-bottom: 1px solid #334155; }

                .animate-fade-in { animation: fadeIn 0.8s ease; }
                .animate-pop-in { animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes popIn { from { scale: 0.9; opacity: 0; } to { scale: 1; opacity: 1; } }
            `}} />
        </div>
    );
};

export default AdminPanel;
