import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Home, Briefcase, Award, Settings, Loader, Lock,
    LayoutDashboard, ChevronLeft, ChevronRight, Calendar,
    Grid, List
} from 'lucide-react';

const ALL_CLASSES = ['9 A', '9 B', '10 A', '10 B'];

const CLASS_COLORS = {
    '9 A':  { bg: 'bg-violet-500/10',  border: 'border-violet-500/30',  text: 'text-violet-300',  badge: 'bg-violet-500',   dot: 'bg-violet-400' },
    '9 B':  { bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30',    text: 'text-cyan-300',    badge: 'bg-cyan-500',     dot: 'bg-cyan-400' },
    '10 A': { bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30',  text: 'text-yellow-300',  badge: 'bg-yellow-500',   dot: 'bg-yellow-400' },
    '10 B': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-300', badge: 'bg-emerald-500',  dot: 'bg-emerald-400' },
};

const days = [
    { id: 'Monday',    name: 'Дүйсенбі' },
    { id: 'Tuesday',   name: 'Сейсенбі' },
    { id: 'Wednesday', name: 'Сәрсенбі' },
    { id: 'Thursday',  name: 'Бейсенбі' },
    { id: 'Friday',    name: 'Жұма' },
];

const dummyDates = {
    'Дүйсенбі': '9 НАУРЫЗ',
    'Сейсенбі': '10 НАУРЫЗ',
    'Сәрсенбі': '11 НАУРЫЗ',
    'Бейсенбі': '12 НАУРЫЗ',
    'Жұма':     '13 НАУРЫЗ',
};

const ScheduleView = () => {
    const navigate = useNavigate();

    const [studentName, setStudentName] = useState('Оқушы');
    const [role, setRole] = useState('student');
    const [selectedClass, setSelectedClass] = useState('10 A');
    const [schedule, setSchedule] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeDay, setActiveDay] = useState('Сәрсенбі');

    // Admin overview mode
    const [viewMode, setViewMode] = useState('single'); // 'single' | 'overview'
    const [allSchedules, setAllSchedules] = useState({}); // { '9 A': {...}, '10 A': {...}, ... }
    const [overviewLoading, setOverviewLoading] = useState(false);

    useEffect(() => {
        const savedName = sessionStorage.getItem('studentName');
        const savedRole = sessionStorage.getItem('role') || 'student';
        const userClass = sessionStorage.getItem('className') || '10 A';

        if (!savedName) { navigate('/'); return; }

        setStudentName(savedName);
        setRole(savedRole);

        if (savedRole === 'admin') {
            setSelectedClass('10 A');
            fetchSchedule('10 A');
        } else {
            setSelectedClass(userClass);
            fetchSchedule(userClass);
        }
    }, [navigate]);

    const fetchSchedule = async (cls) => {
        setLoading(true);
        setSchedule({});
        try {
            const res = await axios.get(`http://localhost:8000/api/v1/schedule?class_name=${encodeURIComponent(cls)}`);
            if (res.data.status === 'success') setSchedule(res.data.schedule || {});
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchAllSchedules = useCallback(async () => {
        setOverviewLoading(true);
        try {
            const results = await Promise.all(
                ALL_CLASSES.map(cls =>
                    axios.get(`http://localhost:8000/api/v1/schedule?class_name=${encodeURIComponent(cls)}`)
                        .then(r => ({ cls, data: r.data.schedule || {} }))
                        .catch(() => ({ cls, data: {} }))
                )
            );
            const map = {};
            results.forEach(({ cls, data }) => { map[cls] = data; });
            setAllSchedules(map);
        } catch (e) { console.error(e); }
        finally { setOverviewLoading(false); }
    }, []);

    const handleViewMode = (mode) => {
        setViewMode(mode);
        if (mode === 'overview' && Object.keys(allSchedules).length === 0) {
            fetchAllSchedules();
        }
    };

    const handleClassChange = (cls) => {
        setSelectedClass(cls);
        fetchSchedule(cls);
    };

    const activeDayId = days.find(d => d.name === activeDay)?.id;
    const activeLessons = (schedule || {})[activeDayId] || [];

    // ===================== RENDER =====================
    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans pb-20">
            {/* NAV */}
            <nav className="sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur-xl border-b border-white/10 px-6 h-20 flex items-center justify-between shadow-2xl">
                <div onClick={() => navigate('/homepage')} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-400/20">
                        <Award className="text-slate-900 w-6 h-6" />
                    </div>
                    <span className="font-black text-2xl tracking-tighter text-white">Picka<span className="text-yellow-400">chu</span></span>
                </div>

                <div className="hidden lg:flex space-x-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                    <button onClick={() => navigate('/homepage')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                        <Home size={18} /> Басты бет
                    </button>
                    {role !== 'admin' && (
                        <>
                            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                                <Calendar size={18} /> Күнделік
                            </button>
                            <button onClick={() => navigate('/portfolio')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                                <Briefcase size={18} /> Портфолио
                            </button>
                        </>
                    )}
                    {role === 'admin' && (
                        <button onClick={() => navigate('/admin')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                            <Settings size={18} /> Басқару
                        </button>
                    )}
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white/10 text-yellow-400 shadow-md">
                        <LayoutDashboard size={18} /> Кесте
                    </button>
                </div>

                <div className="flex items-center gap-3 pl-5 border-l border-white/10">
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-black text-white">{studentName}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            {role === 'admin' ? 'Әкімші' : selectedClass}
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center text-slate-900 font-black text-lg shadow-lg">
                        {studentName.charAt(0).toUpperCase()}
                    </div>
                </div>
            </nav>

            <main className="max-w-screen-2xl mx-auto px-4 sm:px-8 mt-10">

                {/* HEADER ROW */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">
                            Оқу кестесі
                            {viewMode === 'single' && <span className="ml-3 text-yellow-400">{selectedClass}</span>}
                            {viewMode === 'overview' && <span className="ml-3 text-yellow-400">— Барлық сыныптар</span>}
                        </h1>
                        <p className="text-slate-400 mt-1 text-sm">
                            {role === 'admin' ? 'Кестені сынып немесе барлық сыныптар бойынша қараңыз' : 'Сіздің сыныбыңыздың оқу кестесі'}
                        </p>
                    </div>

                    {/* ADMIN CONTROLS */}
                    {role === 'admin' && (
                        <div className="flex flex-col gap-3 items-end">
                            {/* View mode toggle */}
                            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
                                <button
                                    onClick={() => handleViewMode('single')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all ${viewMode === 'single' ? 'bg-yellow-400 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
                                >
                                    <List size={16} /> Жеке сынып
                                </button>
                                <button
                                    onClick={() => handleViewMode('overview')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all ${viewMode === 'overview' ? 'bg-yellow-400 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
                                >
                                    <Grid size={16} /> Барлық сыныптар
                                </button>
                            </div>

                            {/* Class picker for single mode */}
                            {viewMode === 'single' && (
                                <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                                    {ALL_CLASSES.map(cls => (
                                        <button
                                            key={cls}
                                            onClick={() => handleClassChange(cls)}
                                            className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${selectedClass === cls ? 'bg-white/20 text-white shadow-md' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                                        >
                                            {cls}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* DAY TABS */}
                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 mb-6 gap-1 overflow-x-auto">
                    <button className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-white hover:bg-white/5 transition-all whitespace-nowrap">
                        <ChevronLeft size={15} />
                    </button>
                    {days.map(day => (
                        <button
                            key={day.id}
                            onClick={() => setActiveDay(day.name)}
                            className={`flex-1 min-w-[90px] py-2.5 px-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all whitespace-nowrap ${
                                activeDay === day.name
                                    ? 'bg-yellow-400 text-slate-900 shadow-md'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {day.name}
                        </button>
                    ))}
                    <button className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-white hover:bg-white/5 transition-all whitespace-nowrap">
                        <ChevronRight size={15} />
                    </button>
                </div>

                {/* DATE */}
                <div className="mb-6">
                    <span className="text-2xl font-black text-yellow-400">{dummyDates[activeDay]}</span>
                    <span className="ml-3 text-slate-500 font-medium">{activeDay}</span>
                </div>

                {/* ===================== SINGLE CLASS TABLE ===================== */}
                {viewMode === 'single' && (
                    <div className="bg-white/[0.03] border border-white/10 rounded-[1.5rem] overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-white/[0.04] text-slate-400 text-xs font-black uppercase tracking-widest border-b border-white/10">
                                        <th className="py-4 px-5 text-center w-12">№</th>
                                        <th className="py-4 px-5">Пән және мұғалім</th>
                                        <th className="py-4 px-5 text-center w-44">Уақыт</th>
                                        <th className="py-4 px-5 text-center w-24">Каб.</th>
                                        <th className="py-4 px-5 w-56">Тақырып</th>
                                        <th className="py-4 px-5 text-center w-28">Сабақ</th>
                                        <th className="py-4 px-5">Үй тапсырмасы</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" className="py-20 text-center">
                                                <Loader className="animate-spin text-yellow-400 mx-auto mb-3" size={36} />
                                                <p className="text-slate-500 font-bold">Жүктелуде...</p>
                                            </td>
                                        </tr>
                                    ) : activeLessons.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="py-20 text-center">
                                                <Lock className="mx-auto mb-3 text-slate-700" size={40} />
                                                <p className="text-slate-500 font-bold">Бұл күнге сабақ жоқ</p>
                                            </td>
                                        </tr>
                                    ) : activeLessons.map((lesson, idx) => (
                                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="py-5 px-5 text-center">
                                                <span className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 font-black text-sm mx-auto">
                                                    {idx + 1}
                                                </span>
                                            </td>
                                            <td className="py-5 px-5">
                                                <div className="text-base font-black text-white">{lesson.subject}</div>
                                                <div className="text-xs text-slate-500 mt-0.5 font-bold">{selectedClass}</div>
                                                <div className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                                                    {lesson.teacher}
                                                </div>
                                            </td>
                                            <td className="py-5 px-5 text-center">
                                                <span className="text-sm font-black text-slate-200 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 inline-block">
                                                    {lesson.time}
                                                </span>
                                            </td>
                                            <td className="py-5 px-5 text-center">
                                                <span className="text-xs font-bold text-slate-400 bg-white/5 rounded-lg px-2 py-1 inline-block">
                                                    {lesson.room}
                                                </span>
                                            </td>
                                            <td className="py-5 px-5">
                                                <span className="text-sm text-slate-600 italic">Анықталмаған</span>
                                            </td>
                                            <td className="py-5 px-5 text-center">
                                                <button className="px-4 py-1.5 border border-blue-500/40 text-blue-400 rounded-lg text-sm font-bold hover:bg-blue-500/10 transition-colors">
                                                    Өту
                                                </button>
                                            </td>
                                            <td className="py-5 px-5">
                                                <span className="text-slate-700">—</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ===================== OVERVIEW — ALL CLASSES ===================== */}
                {viewMode === 'overview' && (
                    overviewLoading ? (
                        <div className="flex flex-col items-center justify-center py-32">
                            <Loader className="animate-spin text-yellow-400 mb-4" size={48} />
                            <p className="text-slate-500 font-bold text-lg">Барлық сыныптардың кестесі жүктелуде...</p>
                        </div>
                    ) : (
                        <>
                            {/* SUMMARY STATS */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                {ALL_CLASSES.map(cls => {
                                    const c = CLASS_COLORS[cls];
                                    const lessons = (allSchedules[cls] || {})[activeDayId] || [];
                                    return (
                                        <div key={cls} className={`${c.bg} ${c.border} border rounded-2xl p-5`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-lg font-black ${c.text}`}>{cls}</span>
                                                <span className={`text-xs font-black text-white ${c.badge} px-2 py-0.5 rounded-full`}>
                                                    {lessons.length} сабақ
                                                </span>
                                            </div>
                                            <div className="text-slate-400 text-sm">
                                                {lessons.length > 0
                                                    ? `${lessons[0]?.time?.split(' - ')[0]} – ${lessons[lessons.length - 1]?.time?.split(' - ')[1]}`
                                                    : 'Сабақ жоқ'
                                                }
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* BIG GRID — all classes side-by-side */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {ALL_CLASSES.map(cls => {
                                    const c = CLASS_COLORS[cls];
                                    const lessons = (allSchedules[cls] || {})[activeDayId] || [];
                                    return (
                                        <div key={cls} className={`${c.bg} ${c.border} border rounded-2xl overflow-hidden shadow-xl`}>
                                            {/* Class header */}
                                            <div className={`flex items-center justify-between px-6 py-4 border-b ${c.border} bg-black/20`}>
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-3 h-3 rounded-full ${c.dot}`}></span>
                                                    <span className={`text-xl font-black ${c.text}`}>{cls} сынып</span>
                                                </div>
                                                <span className="text-slate-400 text-sm font-bold">{lessons.length} сабақ</span>
                                            </div>

                                            {/* Per-class lessons */}
                                            {lessons.length === 0 ? (
                                                <div className="py-10 text-center text-slate-600 font-medium">
                                                    Бұл күнге сабақ жоқ
                                                </div>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="border-b border-white/5 text-slate-500 text-xs uppercase tracking-widest font-black">
                                                                <th className="py-3 px-5 text-center w-10">№</th>
                                                                <th className="py-3 px-5 text-left">Пән</th>
                                                                <th className="py-3 px-5 text-center">Уақыт</th>
                                                                <th className="py-3 px-5 text-center">Каб.</th>
                                                                <th className="py-3 px-5 text-left">Мұғалім</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/5">
                                                            {lessons.map((lesson, idx) => (
                                                                <tr key={idx} className="hover:bg-black/20 transition-colors">
                                                                    <td className="py-3 px-5 text-center text-slate-500 font-black text-xs">{idx + 1}</td>
                                                                    <td className="py-3 px-5 font-black text-white">{lesson.subject}</td>
                                                                    <td className="py-3 px-5 text-center">
                                                                        <span className={`text-xs font-bold ${c.text} bg-black/30 rounded-md px-2 py-0.5 inline-block whitespace-nowrap`}>
                                                                            {lesson.time}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-3 px-5 text-center text-slate-500 font-bold text-xs">{lesson.room}</td>
                                                                    <td className="py-3 px-5 text-slate-400 text-xs">{lesson.teacher}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )
                )}
            </main>
        </div>
    );
};

export default ScheduleView;
