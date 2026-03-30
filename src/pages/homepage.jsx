import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Home, Calendar, BookOpen, Briefcase, Award, Loader,
    ChevronLeft, ChevronRight, Settings
} from 'lucide-react';

const HomePage = () => {
    const navigate = useNavigate();

    // --- СОСТОЯНИЯ ПРОФИЛЯ ---
    const [studentName, setStudentName] = useState('Оқушы');
    const [className, setClassName] = useState('');
    const [subgroup, setSubgroup] = useState('');

    // --- СОСТОЯНИЯ ГЛАВНОЙ СТРАНИЦЫ (HOME) ---
    const [homeData, setHomeData] = useState({ news: [], recent_grades: [] });
    const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedName = localStorage.getItem('studentName');
        if (!savedName) {
            navigate('/');
        } else {
            setStudentName(savedName);
            setClassName(localStorage.getItem('className') || '10 A');
            setSubgroup(localStorage.getItem('subgroup') || '1-группа');
            fetchHomeData();
        }
    }, [navigate]);

    // --- API ЗАПРОСЫ ---
    const fetchHomeData = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:8000/api/v1/home/data');
            if (res.data?.status === 'success') {
                setHomeData(res.data);
            }
        } catch (e) {
            console.error("Home data error:", e);
        } finally {
            setLoading(false);
        }
    };

    // --- ЛОГИКА СЛАЙДЕРА НОВОСТЕЙ ---
    const nextNews = () => {
        setCurrentNewsIndex((prev) => (prev + 1) % (homeData.news.length || 1));
    };
    const prevNews = () => {
        setCurrentNewsIndex((prev) => (prev - 1 + (homeData.news.length || 1)) % (homeData.news.length || 1));
    };

    // --- ЦВЕТА ---
    const getStyles = (p) => {
        if (p === null || p === undefined) return "text-slate-600 border-white/5 bg-white/5";
        if (p >= 85) return "text-green-400 border-green-500/30 bg-green-500/10";
        if (p >= 79) return "text-emerald-500/70 border-emerald-500/20 bg-emerald-500/5";
        if (p >= 65) return "text-orange-400 border-orange-500/30 bg-orange-500/10";
        return "text-red-400 border-red-500/30 bg-red-500/10";
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 pb-20 font-sans">
            {/* Скрываем скроллбар для красоты */}
            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

            {/* НАВИГАЦИЯ (ШАПКА) */}
            <nav className="sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur-xl border-b border-white/10 px-8 h-20 flex items-center justify-between shadow-2xl">
                <div onClick={() => navigate('/homepage')} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-400/20">
                        <Award className="text-slate-900 w-6 h-6" />
                    </div>
                    <span className="font-black text-2xl tracking-tighter text-white">Picka<span className="text-yellow-400">chu</span></span>
                </div>

                <div className="hidden lg:flex space-x-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                    {/* АКТИВНАЯ Вкладка Домик */}
                    <button onClick={() => navigate('/homepage')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all bg-white/10 text-yellow-400 shadow-md">
                        <Home size={18}/> Басты бет
                    </button>
                    {/* ПЕРЕХОД НА ДАШБОРД */}
                    <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all text-slate-400 hover:text-white hover:bg-white/5">
                        <Calendar size={18}/> Күнделік
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5">
                        <BookOpen size={18}/> Пәндер
                    </button>
                    {/* ПЕРЕХОД НА ПОРТФОЛИО */}
                    <button onClick={() => navigate('/portfolio')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5">
                        <Briefcase size={18}/> Портфолио
                    </button>
                </div>

                <div className="flex items-center gap-5">
                    <button className="p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all hidden sm:block">
                        <Settings size={20} />
                    </button>
                    <div className="flex items-center gap-3 pl-5 border-l border-white/10">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-black text-white leading-tight">{studentName}</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{className} • {subgroup}</div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center text-slate-900 font-black text-lg shadow-lg cursor-pointer hover:scale-105 transition-transform">
                            {studentName.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-screen-2xl mx-auto px-8 mt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-12">
                    {/* БЛОК НОВОСТЕЙ (СЛАЙДЕР) */}
                    <section>
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">Мектеп жаңалықтары</h2>
                            <div className="flex gap-2">
                                <button onClick={prevNews} className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all active:scale-95"><ChevronLeft size={20}/></button>
                                <button onClick={nextNews} className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all active:scale-95"><ChevronRight size={20}/></button>
                            </div>
                        </div>

                        {homeData.news.length > 0 ? (
                            <div className="overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl relative h-[360px] bg-slate-800 group cursor-pointer">
                                <img
                                    key={currentNewsIndex}
                                    src={homeData.news[currentNewsIndex]?.image}
                                    className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-[2s] ease-out animate-in fade-in zoom-in-95"
                                    alt="News"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] via-[#0f172a]/70 to-transparent p-12 flex flex-col justify-center">
                                    <span className="text-yellow-400 font-black mb-4 tracking-widest uppercase text-xs">School news</span>
                                    <h1 className="text-5xl font-black text-white mb-5 tracking-tighter drop-shadow-lg max-w-2xl leading-tight">
                                        {homeData.news[currentNewsIndex]?.title}
                                    </h1>
                                    <p className="text-slate-300 font-medium max-w-lg text-lg leading-relaxed drop-shadow-md">
                                        {homeData.news[currentNewsIndex]?.description}
                                    </p>
                                    <div className="mt-8 px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-xl w-fit text-white font-bold text-sm border border-white/10 shadow-lg">
                                        {homeData.news[currentNewsIndex]?.date}
                                    </div>
                                </div>

                                {/* Точки пагинации слайдера */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                                    {homeData.news.map((_, idx) => (
                                        <div key={idx} className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentNewsIndex ? 'bg-yellow-400 w-6' : 'bg-white/30'}`} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-[360px] rounded-[2.5rem] border border-white/10 flex items-center justify-center bg-white/5"><Loader className="animate-spin text-yellow-400" size={32}/></div>
                        )}
                    </section>

                    {/* БЛОК ПОСЛЕДНИХ ОЦЕНОК (ЛЕНТА) */}
                    <section>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-white text-3xl font-black tracking-tight">Соңғы алынған бағалар</h2>
                        </div>
                        <div className="flex gap-5 overflow-x-auto pb-6 no-scrollbar snap-x">
                            {homeData.recent_grades.map((item, idx) => {
                                const styleClass = getStyles(item.p);
                                const bgClass = styleClass.includes('green') ? 'bg-green-500' : styleClass.includes('emerald') ? 'bg-emerald-500' : styleClass.includes('orange') ? 'bg-orange-400' : 'bg-red-500';

                                return (
                                    <div key={idx} className="snap-start min-w-[320px] bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 hover:bg-white/[0.06] transition-all cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1">
                                        <div className="flex justify-between items-start mb-10">
                                            <h3 className="text-2xl font-black text-white max-w-[140px] leading-tight">{item.subject}</h3>
                                            <div className={`w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-xl ${bgClass} text-slate-900`}>
                                                <span className="text-2xl font-black leading-none">{item.score}</span>
                                                <span className="text-[11px] font-black uppercase tracking-wider mt-1 opacity-80">{item.type}</span>
                                            </div>
                                        </div>
                                        <div className="text-slate-500 font-bold text-sm tracking-wide">{item.date}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default HomePage;