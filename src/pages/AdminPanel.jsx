import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../App.css';
import { BarChart3, Calendar, FileText, Users, GraduationCap, LayoutDashboard, Loader, ChevronLeft, ChevronRight } from 'lucide-react';

const ALL_CLASSES = ['9 A', '9 B', '10 A', '10 B'];
const CLASS_COLORS = {
    '9 A':  { bg: 'bg-violet-500/10',  border: 'border-violet-500/30',  text: 'text-violet-300',  dot: 'bg-violet-400',  badge: 'bg-violet-500/20 text-violet-300' },
    '9 B':  { bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30',    text: 'text-cyan-300',    dot: 'bg-cyan-400',    badge: 'bg-cyan-500/20 text-cyan-300' },
    '10 A': { bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30',  text: 'text-yellow-300',  dot: 'bg-yellow-400',  badge: 'bg-yellow-500/20 text-yellow-300' },
    '10 B': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-300', dot: 'bg-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
};
const DAYS = [
    { id: 'Monday',    name: 'Дүйсенбі' },
    { id: 'Tuesday',   name: 'Сейсенбі' },
    { id: 'Wednesday', name: 'Сәрсенбі' },
    { id: 'Thursday',  name: 'Бейсенбі' },
    { id: 'Friday',    name: 'Жұма' },
];

const AdminPanel = () => {
    const [radarData, setRadarData] = useState([]);
    const [scheduleMsg, setScheduleMsg] = useState("");
    const [loading, setLoading] = useState(false);
    // Tab states
    const [mainTab, setMainTab] = useState('management'); // management, students, teachers
    const [subTab, setSubTab] = useState('radar'); // radar, schedule, news

    // News Form state
    const [newsForm, setNewsForm] = useState({ title: '', description: '', image_url: '', target: 'all' });
    const [newsMsg, setNewsMsg] = useState("");

    // AI Settings state
    const [roomsList, setRoomsList] = useState("101, 102, 103, 104, 201, 202, 203, 204");
    const [sickForm, setSickForm] = useState({ name: 'Иванова О.', day: 'Сәрсенбі' });
    const [sickTeachers, setSickTeachers] = useState([]);

    const TEACHERS_LIST = ["Смагулов Б.", "Абдикаримова А.", "Иванова О.", "Асанов М.", "Кенжебаев Д.", "Серикбол Ж.", "Алиева С.", "Нуртаев К.", "Алдияр Т.", "Сапарова Л.", "Мурзабаева А.", "Смит Д.", "Ахметова Ж.", "Ермеков Н.", "Оспанов Т."];

    // Schedule overview state
    const [scheduleDay, setScheduleDay] = useState('Сәрсенбі');
    const [allSchedules, setAllSchedules] = useState({});
    const [scheduleLoading, setScheduleLoading] = useState(false);
    const [scheduleLoaded, setScheduleLoaded] = useState(false);

    useEffect(() => {
        fetchRadar();
    }, []);

    const fetchAllSchedules = useCallback(async () => {
        if (scheduleLoaded) return;
        setScheduleLoading(true);
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
            setScheduleLoaded(true);
        } catch(e) { console.error(e); }
        finally { setScheduleLoading(false); }
    }, [scheduleLoaded]);

    const fetchRadar = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/v1/admin/radar');
            if (res.data.status === "success") {
                setRadarData(res.data.parallels);
            }
        } catch(e) {
            // Mock data if backend fails
            setRadarData([
                { name: "10-сыныптар", attendance: 95, quality: 82 },
                { name: "11-сыныптар", attendance: 92, quality: 78 }
            ]);
        }
    };

    const generateSchedule = async () => {
        setLoading(true);
        
        try {
            const res = await axios.post('http://localhost:8000/api/v1/schedule/generate', {
                available_rooms: roomsList,
                sick_teachers: sickTeachers.map(st => ({ 
                    name: st.name, 
                    day: DAYS.find(d => d.name === st.day)?.id || 'Wednesday' 
                })),
                use_gemini: true
            });
            
            if (res.data.status === "success") {
                setScheduleMsg(res.data.message);
                setScheduleLoaded(false);
                setTimeout(() => { fetchAllSchedules(); }, 1000); // Reload the overview table after a brief moment
            } else {
                alert("Қате (Ошибка): " + res.data.message);
            }
        } catch (e) {
            console.error(e);
            alert("Сервермен байланыс кезінде қате сәт (Ошибка сети)!");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans p-8">
            <header className="mb-8 border-b border-slate-800 pb-6">
                <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Басқару панелі
                </h1>
                <p className="text-slate-400 mt-2 text-lg">Aqbobek Lyceum әкімшілігінің орталығы</p>
            </header>

            {/* MAIN TABS */}
            <div className="flex gap-4 mb-8">
                <button 
                    onClick={() => setMainTab('management')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${mainTab === 'management' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                >
                    <LayoutDashboard size={20} />
                    Басқару (1-вкладка)
                </button>
                <button 
                    onClick={() => setMainTab('students')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${mainTab === 'students' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                >
                    <GraduationCap size={20} />
                    Оқушылар
                </button>
                <button 
                    onClick={() => setMainTab('teachers')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${mainTab === 'teachers' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                >
                    <Users size={20} />
                    Мұғалімдер
                </button>
            </div>

            {/* CONTENT AREA FOR MAIN TAB */}
            {mainTab === 'management' && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                    {/* 3 SUB-TABS (ТРИ ВКЛАДКИ В ПЕРВОЙ ВКЛАДКЕ) */}
                    <div className="flex border-b border-slate-700 mb-6">
                        <button 
                            onClick={() => setSubTab('radar')}
                            className={`flex items-center gap-2 px-6 py-4 font-bold border-b-2 transition-all ${subTab === 'radar' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'}`}
                        >
                            <BarChart3 size={18} />
                            Сапа радары (Радар)
                        </button>
                        <button 
                            onClick={() => setSubTab('schedule')}
                            className={`flex items-center gap-2 px-6 py-4 font-bold border-b-2 transition-all ${subTab === 'schedule' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'}`}
                        >
                            <Calendar size={18} />
                            Кесте (Расписание)
                        </button>
                        <button 
                            onClick={() => setSubTab('news')}
                            className={`flex items-center gap-2 px-6 py-4 font-bold border-b-2 transition-all ${subTab === 'news' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'}`}
                        >
                            <FileText size={18} />
                            Жаңалықтар (Новости)
                        </button>
                    </div>

                    {/* SUB-TAB CONTENTS */}
                    <div className="p-4">
                        {subTab === 'radar' && (
                            <div className="animate-in fade-in duration-500">
                                <h2 className="text-2xl font-bold text-white mb-6">📊 Білім сапасы (Параллельдер)</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {radarData?.map(p => (
                                        <div key={p.name} className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-lg">
                                            <div className="flex justify-between items-end mb-4">
                                                <strong className="text-xl text-white">{p.name}</strong>
                                                <span className="text-sm text-slate-400">Қатысу: {p.attendance}%</span>
                                            </div>
                                            <div className="h-4 bg-slate-800 rounded-full overflow-hidden relative">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 flex items-center justify-end"
                                                    style={{width: `${p.quality}%`}}
                                                >
                                                    <span className="text-[10px] font-bold text-white pr-2">{p.quality}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {subTab === 'schedule' && (() => {
                            // Load on first open
                            if (!scheduleLoaded && !scheduleLoading) fetchAllSchedules();
                            const activeDayId = DAYS.find(d => d.name === scheduleDay)?.id;
                            return (
                            <div className="animate-in fade-in duration-500">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <h2 className="text-2xl font-bold text-white">📅 AI Кесте құру (Генерация ИИ)</h2>
                                </div>

                                {/* AI SETTINGS PANEL */}
                                <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-6 mb-8 shadow-xl">
                                    <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                                        🤖 ИИ Баптаулары (Ограничения)
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-slate-400 font-bold mb-2 text-sm">Қолжетімді кабинеттер (Номера доступных кабинетов через запятую)</label>
                                            <input 
                                                type="text" 
                                                value={roomsList} 
                                                onChange={e => setRoomsList(e.target.value)} 
                                                placeholder="101, 102, 201..."
                                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-yellow-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="mt-6 pt-6 border-t border-slate-700/50">
                                        <label className="block text-slate-400 font-bold mb-3 text-sm">Ауырған мұғалімдер (Болеющие учителя)</label>
                                        <div className="flex flex-wrap gap-3 mb-4">
                                            <select 
                                                value={sickForm.name} 
                                                onChange={e => setSickForm({...sickForm, name: e.target.value})} 
                                                className="bg-slate-900/50 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none"
                                            >
                                                {TEACHERS_LIST.map(t => <option key={t}>{t}</option>)}
                                            </select>
                                            <select 
                                                value={sickForm.day} 
                                                onChange={e => setSickForm({...sickForm, day: e.target.value})} 
                                                className="bg-slate-900/50 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none"
                                            >
                                                {DAYS.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                                            </select>
                                            <button 
                                                onClick={() => setSickTeachers([...sickTeachers, sickForm])} 
                                                className="bg-indigo-600 px-5 py-2.5 rounded-xl text-white font-bold hover:bg-indigo-500 transition-colors"
                                            >
                                                + Қосу (Добавить)
                                            </button>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2">
                                            {sickTeachers.map((st, i) => (
                                                <div key={i} className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 font-medium">
                                                    {st.name} ({st.day})
                                                    <button onClick={() => setSickTeachers(sickTeachers.filter((_, idx) => idx !== i))} className="hover:text-red-300 font-black">×</button>
                                                </div>
                                            ))}
                                            {sickTeachers.length === 0 && <span className="text-sm text-slate-500 italic">Тізім бос (Нет отсутствующих)</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <button
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 text-sm flex items-center gap-2"
                                        onClick={generateSchedule}
                                        disabled={loading}
                                    >
                                        {loading ? <Loader className="animate-spin" size={18} /> : '✨'} 
                                        {loading ? 'ИИ ойлануда (Генерация ИИ)...' : 'Кестені генерациялау (Generate)'}
                                    </button>
                                </div>

                                {scheduleMsg && (
                                    <div className="bg-emerald-900/50 text-emerald-400 border border-emerald-800 p-4 rounded-xl flex items-center gap-3 mb-6 mt-6">
                                        <span>✅</span><span className="font-medium">{scheduleMsg}</span>
                                    </div>
                                )}
                                <div className="mt-10 border-t border-slate-800 pt-8" />
                                
                                {/* DAY SWITCHER */}
                                <div className="flex gap-1 bg-black/30 p-1.5 rounded-2xl border border-white/5 mb-6 overflow-x-auto">
                                    {DAYS.map(day => (
                                        <button
                                            key={day.id}
                                            onClick={() => setScheduleDay(day.name)}
                                            className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wide transition-all whitespace-nowrap ${
                                                scheduleDay === day.name
                                                    ? 'bg-blue-500 text-white shadow-md'
                                                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                                            }`}
                                        >
                                            {day.name}
                                        </button>
                                    ))}
                                </div>

                                {/* STATS ROW */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                                    {ALL_CLASSES.map(cls => {
                                        const c = CLASS_COLORS[cls];
                                        const lessons = (allSchedules[cls] || {})[activeDayId] || [];
                                        return (
                                            <div key={cls} className={`${c.bg} ${c.border} border rounded-xl p-4 flex items-center justify-between`}>
                                                <div>
                                                    <div className={`text-lg font-black ${c.text}`}>{cls}</div>
                                                    <div className="text-slate-500 text-xs mt-0.5">{lessons.length} сабақ</div>
                                                </div>
                                                <span className={`w-3 h-3 rounded-full ${c.dot} shadow-lg`}></span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* CLASSES GRID */}
                                {scheduleLoading ? (
                                    <div className="flex flex-col items-center justify-center py-24">
                                        <Loader className="animate-spin text-blue-400 mb-4" size={40} />
                                        <p className="text-slate-500 font-bold">Барлық сыныптардың кестесі жүктелуде...</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                                        {ALL_CLASSES.map(cls => {
                                            const c = CLASS_COLORS[cls];
                                            const lessons = (allSchedules[cls] || {})[activeDayId] || [];
                                            return (
                                                <div key={cls} className={`${c.bg} ${c.border} border rounded-2xl overflow-hidden shadow-xl`}>
                                                    {/* Card Header */}
                                                    <div className={`flex items-center justify-between px-5 py-4 border-b ${c.border} bg-black/20`}>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`w-3 h-3 rounded-full ${c.dot} shadow`}></span>
                                                            <span className={`text-lg font-black ${c.text}`}>{cls} сынып</span>
                                                        </div>
                                                        <span className={`text-xs font-black px-3 py-1 rounded-full ${c.badge}`}>
                                                            {lessons.length} сабақ
                                                        </span>
                                                    </div>
                                                    {/* Lessons Table */}
                                                    {lessons.length === 0 ? (
                                                        <div className="py-8 text-center text-slate-600 text-sm font-medium">
                                                            Бұл күнге сабақ жоқ
                                                        </div>
                                                    ) : (
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-sm">
                                                                <thead>
                                                                    <tr className="border-b border-white/5 text-slate-500 text-[11px] uppercase tracking-widest font-black">
                                                                        <th className="py-3 px-4 text-center w-8">№</th>
                                                                        <th className="py-3 px-4 text-left">Пән</th>
                                                                        <th className="py-3 px-4 text-center">Уақыт</th>
                                                                        <th className="py-3 px-4 text-center">Каб.</th>
                                                                        <th className="py-3 px-4 text-left">Мұғалім</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-white/5">
                                                                    {lessons.map((lesson, idx) => (
                                                                        <tr key={idx} className="hover:bg-black/20 transition-colors">
                                                                            <td className="py-3 px-4 text-center text-slate-600 font-black text-xs">{idx + 1}</td>
                                                                            <td className="py-3 px-4 font-bold text-white">{lesson.subject}</td>
                                                                            <td className="py-3 px-4 text-center">
                                                                                <span className={`text-xs font-bold ${c.text} bg-black/30 rounded px-2 py-0.5 whitespace-nowrap`}>
                                                                                    {lesson.time}
                                                                                </span>
                                                                            </td>
                                                                            <td className="py-3 px-4 text-center text-slate-500 font-bold text-xs">{lesson.room}</td>
                                                                            <td className="py-3 px-4 text-slate-400 text-xs">{lesson.teacher}</td>
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
                                )}
                            </div>
                            );
                        })()}

                        {subTab === 'news' && (
                            <div className="animate-in fade-in duration-500">
                                <h2 className="text-2xl font-bold text-white mb-6">📰 Жаңалық қосу</h2>
                                
                                <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-lg max-w-2xl">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-slate-400 mb-2 font-bold">Тақырып (Заголовок)</label>
                                            <input 
                                                type="text" 
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                                                value={newsForm.title}
                                                onChange={e => setNewsForm({...newsForm, title: e.target.value})}
                                                placeholder="Жаңалық тақырыбы..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 mb-2 font-bold">Мәтін (Текст)</label>
                                            <textarea 
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 min-h-[120px]"
                                                value={newsForm.description}
                                                onChange={e => setNewsForm({...newsForm, description: e.target.value})}
                                                placeholder="Жаңалықтың толық мәтіні..."
                                            ></textarea>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-slate-400 mb-2 font-bold">Аудитория (Кім көреді?)</label>
                                                <select 
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                                                    value={newsForm.target}
                                                    onChange={e => setNewsForm({...newsForm, target: e.target.value})}
                                                >
                                                    <option value="all">Барлығына (Всем)</option>
                                                    <option value="9-сыныптар">9-сыныптар (9-е классы)</option>
                                                    <option value="10-сыныптар">10-сыныптар (10-е классы)</option>
                                                    <option value="11-сыныптар">11-сыныптар (11-е классы)</option>
                                                    <option value="10 A">Тек 10 А (Только 10 А)</option>
                                                    <option value="10 B">Тек 10 B (Только 10 B)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-slate-400 mb-2 font-bold">Сурет URL (опционально)</label>
                                                <input 
                                                    type="text" 
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                                                    value={newsForm.image_url}
                                                    onChange={e => setNewsForm({...newsForm, image_url: e.target.value})}
                                                    placeholder="https://images.unsplash.com/..."
                                                />
                                            </div>
                                        </div>
                                        
                                        <button 
                                            className="mt-6 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg w-full flex items-center justify-center gap-2"
                                            onClick={async () => {
                                                if (!newsForm.title || !newsForm.description) return alert('Тақырып пен мәтінді толтырыңыз!');
                                                try {
                                                    const res = await axios.post('http://localhost:8000/api/v1/admin/news', newsForm);
                                                    if (res.data.status === 'success') {
                                                        setNewsMsg("✅ " + res.data.message);
                                                        setNewsForm({ title: '', description: '', image_url: '', target: 'all' });
                                                        setTimeout(() => setNewsMsg(""), 4000);
                                                    }
                                                } catch(e) { console.error(e); }
                                            }}
                                        >
                                            <FileText size={18} /> Жариялау (Опубликовать)
                                        </button>
                                        
                                        {newsMsg && (
                                            <div className="bg-emerald-900/40 text-emerald-400 border border-emerald-800 p-3 rounded-lg text-center mt-4">
                                                {newsMsg}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {mainTab !== 'management' && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                    <h3 className="text-2xl font-bold text-slate-400 mb-2">Бұл бөлім әзірленуде</h3>
                    <p className="text-slate-500">Қазіргі уақытта "Басқару" вкладкасы жұмыс істеп тұр.</p>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
