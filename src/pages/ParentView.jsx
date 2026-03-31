import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';

const ParentView = () => {
    const [childData, setChildData] = useState(null);
    const [aiSummary, setAiSummary] = useState("");

    useEffect(() => {
        fetchChildData();
    }, []);

    const fetchChildData = async () => {
        const childId = sessionStorage.getItem('child_id') || 's1';
        const res = await axios.get(`http://localhost:8000/api/v1/ai/student_prediction?uid=${childId}`);
        if (res.data.status === "success") {
            setChildData(res.data);
            setAiSummary("Ваш ребенок молодец в алгебре (85%), но пропустил 2 тематических блока по физике. Рекомендация: обсудить тайм-менеджмент и выделить 2 часа в субботу на повторение темы 'Законы Ньютона'.");
        }
    };

    return (
        <div className="parent-view">
            <header className="premium-header">
                <h1>Режим Родителя: {sessionStorage.getItem('studentName') || 'Алиев Арман'}</h1>
                <p>Еженедельный AI-отчет и мониторинг успеваемости</p>
            </header>

            <div className="observer-grid">
                <section className="ai-summary-card">
                    <h2>🤖 AI-Выжимка за неделю</h2>
                    <div className="summary-bubble">
                        {aiSummary}
                    </div>
                </section>

                <section className="child-radar">
                    <h2>📈 Карта знаний ребенка</h2>
                    {childData && (
                        <div className="radar-mock">
                            {Object.entries(childData.knowledge_graph).map(([k, v]) => (
                                <div key={k} className="skill-row">
                                    <span>{k}</span>
                                    <div className="p-bg"><div className="p-fill" style={{width: `${v}%`}}></div></div>
                                    <strong>{v}%</strong>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .parent-view { padding: 40px; background: #fffbff; min-height: 100vh; font-family: 'Inter', sans-serif; }
                .premium-header { margin-bottom: 30px; text-align: center; }
                .premium-header h1 { font-size: 2.2rem; color: #1e1b4b; }
                
                .observer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; max-width: 1200px; margin: 0 auto; }
                .ai-summary-card, .child-radar { background: white; padding: 30px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #eef2ff; }
                
                .summary-bubble { background: #f5f3ff; color: #4338ca; padding: 25px; border-radius: 20px; font-size: 1.1rem; line-height: 1.6; border-left: 6px solid #6366f1; }
                
                .skill-row { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }
                .skill-row span { width: 100px; font-weight: 600; color: #475569; }
                .p-bg { flex: 1; height: 10px; background: #f1f5f9; border-radius: 5px; overflow: hidden; }
                .p-fill { height: 100%; background: #6366f1; }
            `}} />
        </div>
    );
};

export default ParentView;
