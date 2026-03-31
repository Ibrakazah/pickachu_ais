import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../App.css';

const KioskMode = () => {
    const [news, setNews] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const scrollRef = useRef(null);

    useEffect(() => {
        fetchKioskData();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        const scrollTimer = setInterval(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollBy(0, 1);
                if (scrollRef.current.scrollTop + scrollRef.current.clientHeight >= scrollRef.current.scrollHeight) {
                    scrollRef.current.scrollTop = 0;
                }
            }
        }, 30);
        return () => { clearInterval(timer); clearInterval(scrollTimer); };
    }, []);

    const fetchKioskData = async () => {
        const resHome = await axios.get('http://localhost:8000/api/v1/home/data');
        if (resHome.data.status === "success") setNews(resHome.data.news);
        
        const resGam = await axios.get('http://localhost:8000/api/v1/gamification/data?uid=s1');
        if (resGam.data.status === "success") setLeaderboard(resGam.data.leaderboard);
    };

    return (
        <div className="kiosk-container">
            <header className="kiosk-header">
                <div className="logo-section">
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR61m9c8P7q7z6-6E6-3e-64-6-6-6-6-6" alt="Logo" className="kiosk-logo" />
                    <h1>Aqbobek Lyceum Daily</h1>
                </div>
                <div className="time-section">
                    <span className="kiosk-date">{currentTime.toLocaleDateString()}</span>
                    <span className="kiosk-time">{currentTime.toLocaleTimeString()}</span>
                </div>
            </header>

            <main className="kiosk-grid">
                <section className="news-ticker-container">
                    <div className="section-title">✨ Актуальные Новости & События</div>
                    <div className="news-scroll-box" ref={scrollRef}>
                        {news.map(n => (
                            <div key={n.id} className="news-kiosk-card">
                                {n.image && <img src={n.image} alt="news" />}
                                <div className="news-k-info">
                                    <h3>{n.title}</h3>
                                    <p>{n.description}</p>
                                    <span className="n-date">{n.date}</span>
                                </div>
                            </div>
                        ))}
                        {/* Duplicate for seamless scroll */}
                        {news.map(n => (
                            <div key={`dup-${n.id}`} className="news-kiosk-card">
                                {n.image && <img src={n.image} alt="news" />}
                                <div className="news-k-info">
                                    <h3>{n.title}</h3>
                                    <p>{n.description}</p>
                                    <span className="n-date">{n.date}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <aside className="stats-panel">
                    <div className="leaderboard-kiosk">
                        <div className="section-title">🏆 ТОП Учеников Года</div>
                        <div className="l-list">
                            {leaderboard.map((u, i) => (
                                <div key={u.name} className={`l-item rank-${i+1}`}>
                                    <span className="rank-num">#{i+1}</span>
                                    <span className="u-name">{u.name}</span>
                                    <span className="u-points">{u.points} pts</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="quick-schedule">
                        <div className="section-title">⏱️ Ближайшие Уроки</div>
                        <div className="s-mini-card">
                            <div className="s-time">10:30 - 11:15</div>
                            <div className="s-info">
                                <strong>Геометрия</strong>
                                <span>10 A | каб. 301</span>
                            </div>
                        </div>
                        <div className="s-mini-card replacement">
                            <div className="s-time">11:25 - 12:10</div>
                            <div className="s-info">
                                <strong>Физика (ЗАМЕНА)</strong>
                                <span>10 A | каб. 204</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </main>

            <style dangerouslySetInnerHTML={{ __html: `
                .kiosk-container { background: #000; color: white; width: 100vw; height: 100vh; font-family: 'Outfit', sans-serif; overflow: hidden; padding: 20px; display: flex; flex-direction: column; }
                .kiosk-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #222; padding-bottom: 20px; margin-bottom: 20px; }
                .logo-section { display: flex; align-items: center; gap: 20px; }
                .kiosk-logo { width: 80px; filter: drop-shadow(0 0 10px #6366f1); }
                .logo-section h1 { font-size: 3rem; background: linear-gradient(135deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                
                .time-section { text-align: right; }
                .kiosk-date { display: block; font-size: 1.2rem; color: #64748b; }
                .kiosk-time { font-size: 2.5rem; font-weight: bold; color: #fff; }

                .kiosk-grid { display: grid; grid-template-columns: 1fr 450px; gap: 30px; flex: 1; min-height: 0; }
                
                .section-title { font-size: 1.8rem; font-weight: 800; margin-bottom: 20px; padding-left: 15px; border-left: 6px solid #6366f1; }
                
                .news-ticker-container { background: #111; border-radius: 30px; padding: 30px; display: flex; flex-direction: column; min-height: 0; }
                .news-scroll-box { flex: 1; overflow-y: hidden; display: flex; flex-direction: column; gap: 30px; }
                
                .news-kiosk-card { background: #1a1a1a; border-radius: 24px; padding: 25px; display: flex; gap: 30px; align-items: center; }
                .news-kiosk-card img { width: 200px; height: 150px; object-fit: cover; border-radius: 16px; box-shadow: 0 10px 20px rgba(0,0,0,0.5); }
                .news-k-info h3 { font-size: 2rem; margin: 0 0 10px 0; color: #fff; }
                .news-k-info p { font-size: 1.3rem; color: #94a3b8; line-height: 1.6; }
                
                .stats-panel { display: flex; flex-direction: column; gap: 30px; }
                .leaderboard-kiosk, .quick-schedule { background: #111; border-radius: 30px; padding: 30px; }
                
                .l-item { display: flex; align-items: center; gap: 20px; padding: 15px; background: #1a1a1a; margin-bottom: 12px; border-radius: 16px; font-size: 1.4rem; }
                .rank-num { font-weight: 800; color: #6366f1; width: 40px; }
                .u-name { flex: 1; font-weight: 600; }
                .u-points { color: #facc15; font-weight: bold; }
                
                .rank-1 { border: 2px solid #facc15; box-shadow: 0 0 20px rgba(250, 204, 21, 0.2); }
                
                .s-mini-card { background: #1a1a1a; padding: 20px; border-radius: 16px; display: flex; gap: 20px; margin-bottom: 15px; align-items: center; }
                .s-time { font-size: 1.2rem; font-weight: 800; color: #6366f1; min-width: 120px; }
                .s-info strong { display: block; font-size: 1.3rem; color: #fff; }
                .s-info span { color: #64748b; font-size: 1rem; }
                
                .replacement { border-left: 8px solid #ef4444; background: #221111; }
            `}} />
        </div>
    );
};

export default KioskMode;
