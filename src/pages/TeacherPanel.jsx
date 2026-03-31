import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';

const TeacherPanel = () => {
    const [riskyStudents, setRiskyStudents] = useState([]);
    const [aiReport, setAiReport] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchRiskData();
    }, []);

    const fetchRiskData = async () => {
        const res = await axios.get('http://localhost:8000/api/v1/teacher/early_warning');
        if (res.data.status === "success") {
            setRiskyStudents(res.data.risky_students);
        }
    };

    const generateReport = async () => {
        setLoading(true);
        const res = await axios.get('http://localhost:8000/api/v1/ai/teacher_report');
        if (res.data.status === "success") {
            setAiReport(res.data.report);
        }
        setLoading(false);
    };

    return (
        <div className="teacher-panel">
            <header className="premium-header">
                <h1>Панель Учителя: Аналитика и Отчеты</h1>
                <p>Система раннего предупреждения (Early Warning System)</p>
            </header>

            <div className="analytics-grid">
                <section className="risk-card">
                    <h2>⚠️ Зона Риска (Успеваемость)</h2>
                    <div className="risk-list">
                        {riskyStudents.map(s => (
                            <div key={s.id} className="student-risk-item">
                                <div className="student-info">
                                    <strong>{s.name}</strong>
                                    <span>Предмет: {s.subject}</span>
                                </div>
                                <div className="risk-metrics">
                                    <span className="drop-tag">Спад: {s.drop_percent}%</span>
                                    <div className="recent-marks">
                                        {s.last_marks.map((m, i) => (
                                            <span key={i} className={`mark-badge ${m < 3 ? 'low' : ''}`}>{m}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="report-card">
                    <h2>🤖 AI Генератор Отчетов</h2>
                    <p>Сформируйте отчет для классного руководства в один клик.</p>
                    <button className="premium-btn" onClick={generateReport} disabled={loading}>
                        {loading ? "Анализ данных..." : "Сгенерировать Отчет"}
                    </button>
                    {aiReport && (
                        <div className="ai-report-content animate-fade-in">
                            <pre>{aiReport}</pre>
                        </div>
                    )}
                </section>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .teacher-panel { padding: 40px; background: #f8fafc; min-height: 100vh; font-family: 'Inter', sans-serif; }
                .premium-header { margin-bottom: 40px; }
                .premium-header h1 { font-size: 2.5rem; color: #1e293b; margin: 0; }
                .premium-header p { color: #64748b; font-size: 1.1rem; }
                
                .analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
                .risk-card, .report-card { background: white; padding: 30px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
                
                .risk-list { display: flex; flex-direction: column; gap: 15px; margin-top: 20px; }
                .student-risk-item { display: flex; justify-content: space-between; align-items: center; padding: 20px; background: #fff1f2; border-radius: 16px; border-left: 5px solid #ef4444; }
                .student-info strong { display: block; font-size: 1.2rem; color: #991b1b; }
                .student-info span { color: #b91c1c; font-size: 0.9rem; }
                
                .risk-metrics { text-align: right; }
                .drop-tag { background: #fee2e2; color: #ef4444; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 0.8rem; }
                .recent-marks { display: flex; gap: 5px; margin-top: 10px; justify-content: flex-end; }
                .mark-badge { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; background: #e2e8f0; border-radius: 8px; font-weight: bold; }
                .mark-badge.low { background: #fca5a5; color: #991b1b; }

                .premium-btn { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; border: none; padding: 15px 30px; border-radius: 12px; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: 0.3s; margin-top: 10px; }
                .premium-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3); }
                .premium-btn:disabled { opacity: 0.6; cursor: not-allowed; }

                .ai-report-content { margin-top: 25px; padding: 20px; background: #f0f9ff; border-radius: 16px; color: #0369a1; border: 1px solid #bae6fd; font-family: monospace; white-space: pre-wrap; }
                .animate-fade-in { animation: fadeIn 0.5s ease; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}} />
        </div>
    );
};

export default TeacherPanel;
