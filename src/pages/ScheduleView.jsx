import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Home, Calendar, BookOpen, Briefcase, Award, Settings, Loader, Lock, LayoutDashboard
} from 'lucide-react';
import '../App.css';

const ScheduleView = () => {
    const navigate = useNavigate();
    
    // --- СОСТОЯНИЯ ПРОФИЛЯ ---
    const [studentName, setStudentName] = useState('Оқушы');
    const [className, setClassName] = useState('');
    const [subgroup, setSubgroup] = useState('');

    const [schedule, setSchedule] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedName = localStorage.getItem('studentName');
        if (!savedName) {
            navigate('/');
        } else {
            setStudentName(savedName);
            const userClass = localStorage.getItem('className') || '10 A';
            setClassName(userClass);
            setSubgroup(localStorage.getItem('subgroup') || '1-группа');
            fetchSchedule(userClass);
        }
    }, [navigate]);

    const fetchSchedule = async (userClass) => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:8000/api/v1/schedule?class_name=${encodeURIComponent(userClass)}`);
            if (res.data.status === "success") {
                setSchedule(res.data.schedule);
            }
        } catch (e) {
            console.error("Schedule error:", e);
        } finally {
            setLoading(false);
        }
    };

    const daysTranslation = {
        "Monday": "Дүйсенбі",
        "Tuesday": "Сейсенбі",
        "Wednesday": "Сәрсенбі",
        "Thursday": "Бейсенбі",
        "Friday": "Жұма"
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 pb-20 font-sans">
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
                    <button onClick={() => navigate('/homepage')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all text-slate-400 hover:text-white hover:bg-white/5">
                        <Home size={18}/> Басты бет
                    </button>
                    <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all text-slate-400 hover:text-white hover:bg-white/5">
                        <Calendar size={18}/> Күнделік
                    </button>
                    <button onClick={() => navigate('/portfolio')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all text-slate-400 hover:text-white hover:bg-white/5">
                        <Briefcase size={18}/> Портфолио
                    </button>
                    {/* АКТИВНАЯ */}
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all bg-white/10 text-yellow-400 shadow-md">
                        <LayoutDashboard size={18}/> Кесте
                    </button>
                </div>

                <div className="flex items-center gap-5">
                    <button className="p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all hidden sm:block"><Settings size={20} /></button>
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
                <div className="mb-10 flex flex-col items-center text-center">
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase flex items-center gap-4 mb-3">
                        Оқу кестесі: <span className="text-blue-400">{className}</span>
                    </h1>
                    <p className="text-slate-400 font-medium">Smart Schedule — бұл сіздің сыныбыңызға арналған AI-генерацияланған нақты уақыттағы кестесі.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-40">
                        <Loader className="animate-spin text-blue-500" size={48} />
                    </div>
                ) : Object.keys(schedule).length === 0 ? (
                    <div className="bg-white/[0.02] border-2 border-white/5 border-dashed rounded-[3rem] py-24 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 text-slate-600">
                            <Lock size={48} />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2">Кесте әлі жасалған жоқ</h3>
                        <p className="text-slate-500 max-w-sm">Мектеп әкімшілігі әлі AI арқылы расписание генерациялаған жоқ.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
                        {Object.entries(schedule).map(([day, lessons]) => (
                            <div key={day} className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-6 shadow-xl relative overflow-hidden group hover:bg-white/[0.05] transition-all">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors"></div>
                                <h2 className="text-xl font-black text-white mb-6 uppercase tracking-widest border-b border-white/10 pb-4 inline-block">{daysTranslation[day] || day}</h2>
                                
                                <div className="space-y-4 relative z-10">
                                    {lessons.map((l, i) => (
                                        <div key={i} className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 hover:border-blue-500/30 transition-all flex flex-col gap-2 shadow-inner">
                                            <div className="w-fit text-xs font-black bg-blue-500/10 text-blue-400 px-3 py-1 rounded-lg tracking-wider">
                                                {l.time}
                                            </div>
                                            <div>
                                                <strong className="block text-lg text-white font-bold leading-tight">{l.subject}</strong>
                                                <div className="text-sm text-slate-400 mt-1">{l.teacher}</div>
                                                <div className="text-xs text-slate-500 mt-2 flex items-center gap-1 font-medium bg-white/5 w-fit px-2 py-1 rounded-md">
                                                    🏢 Каб: {l.room || '-'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default ScheduleView;
