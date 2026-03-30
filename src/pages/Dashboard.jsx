import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Home, Calendar, BookOpen, Briefcase, Award, Loader,
    Pencil, ChevronUp, ChevronDown, Inbox, Settings
} from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();

    // --- СОСТОЯНИЯ ПРОФИЛЯ ---
    const [studentName, setStudentName] = useState('Оқушы');
    const [className, setClassName] = useState('');
    const [subgroup, setSubgroup] = useState('');

    // --- СОСТОЯНИЯ ВЕДОМОСТИ (GRADES) ---
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuarter, setSelectedQuarter] = useState(1);
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulatedOffsets, setSimulatedOffsets] = useState({});

    useEffect(() => {
        const savedName = localStorage.getItem('studentName');
        if (!savedName) {
            navigate('/');
        } else {
            setStudentName(savedName);
            setClassName(localStorage.getItem('className') || '10 A');
            setSubgroup(localStorage.getItem('subgroup') || '1-группа');
        }
    }, [navigate]);

    useEffect(() => {
        fetchGrades(selectedQuarter);
        setSimulatedOffsets({});
    }, [selectedQuarter]);

    // --- API ЗАПРОСЫ ---
    const fetchGrades = async (quarter) => {
        setLoading(true);
        setTableData([]);
        try {
            const res = await axios.get(`http://localhost:8000/api/v1/grades/quarter?period=${quarter}`);
            if (res.data?.status === 'success') setTableData(res.data.table || []);
        } catch (e) {
            setTableData([]);
        } finally {
            setLoading(false);
        }
    };

    // --- ЛОГИКА СИМУЛЯТОРА ОЦЕНОК (50/50 ФОРМУЛА) ---
    const handleScoreChange = (id, delta) => {
        setSimulatedOffsets(prev => ({ ...prev, [id]: (prev[id] || 0) + delta }));
    };

    const processedData = useMemo(() => {
        return tableData.map((subject) => {
            const simMarks = (subject.marks || []).map((m, mIdx) => {
                const id = `${subject.subject_name}-${m.type}-${mIdx}`;
                const offset = simulatedOffsets[id] || 0;
                const maxVal = m.max > 0 ? m.max : (m.raw_val || 10);
                const currentVal = Math.max(0, Math.min(maxVal, m.raw_val + offset));
                const currentPercent = (currentVal / maxVal) * 100;
                return { ...m, currentVal, currentPercent, id, maxVal };
            });

            const getAvg = (type) => {
                const filtered = simMarks.filter(m => m.type === type);
                return filtered.length ? filtered.reduce((a, b) => a + b.currentPercent, 0) / filtered.length : null;
            };

            const avgFO = getAvg('ФО'), avgBJB = getAvg('БЖБ'), avgTJB = getAvg('ТЖБ');
            let totalAvg = 0, foBjbCombined = 0;

            if (avgFO !== null && avgBJB !== null) foBjbCombined = (avgFO + avgBJB) / 2;
            else foBjbCombined = avgFO ?? avgBJB ?? 0;

            totalAvg = avgTJB !== null ? (avgTJB * 0.5) + (foBjbCombined * 0.5) : foBjbCombined;

            const finalP = Math.round(totalAvg);
            let grade = finalP >= 85 ? 5 : (finalP >= 65 ? 4 : 3);

            return { ...subject, simMarks, avgFO, avgBJB, avgTJB, totalAvg: finalP, grade };
        });
    }, [tableData, simulatedOffsets]);

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
                    {/* ПЕРЕХОД НА ГЛАВНУЮ */}
                    <button onClick={() => navigate('/homepage')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all text-slate-400 hover:text-white hover:bg-white/5">
                        <Home size={18}/> Басты бет
                    </button>
                    {/* АКТИВНАЯ Вкладка Күнделік (Таблица) */}
                    <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all bg-white/10 text-yellow-400 shadow-md">
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
                    {/* Кнопка редактора */}
                    <button onClick={() => { setIsSimulating(!isSimulating); if(isSimulating) setSimulatedOffsets({}); }} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all duration-300 ${isSimulating ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'}`}>
                        <Pencil size={18}/> {isSimulating ? 'Сақтау' : 'Редактор'}
                    </button>

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
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Ведомость по оценкам</h1>
                            <p className="text-slate-400 mt-2 font-medium text-lg">Оценки из BilimClass</p>
                        </div>
                        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md shadow-lg">
                            {[1, 2, 3, 4].map(q => (
                                <button
                                    key={q}
                                    onClick={() => setSelectedQuarter(q)}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${selectedQuarter === q ? 'bg-yellow-400 text-slate-900 shadow-md' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                                >
                                    {q}-тоқсан
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white/[0.02] rounded-[2.5rem] border border-white/10 overflow-x-auto shadow-2xl backdrop-blur-sm">
                        <table className="w-full text-sm min-w-[1100px] border-collapse">
                            <thead>
                            <tr className="text-[11px] uppercase text-slate-500 font-black tracking-[0.2em] border-b border-white/10 bg-white/[0.01]">
                                <th className="px-8 py-6 text-left">Пән атауы</th>
                                <th className="px-8 py-6 text-center">Бағалар</th>
                                <th className="w-24 text-center">%ФБ</th>
                                <th className="w-24 text-center">%БЖБ</th>
                                <th className="w-24 text-center">%ТЖБ</th>
                                <th className="w-32 text-center text-yellow-400">БОЛЖАМ %</th>
                                <th className="w-32 text-center font-black">БАҒА</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan="7" className="py-40 text-center"><Loader className="w-12 h-12 text-yellow-400 animate-spin mx-auto mb-4" /><p className="text-slate-400 font-bold">Жүктелуде...</p></td></tr>
                            ) : processedData.length ? processedData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-8 py-8 text-left font-black text-white text-lg leading-tight">{row.subject_name}</td>

                                    <td className="px-8 py-8">
                                        <div className="flex flex-wrap justify-center gap-3">
                                            {row.simMarks.map((m, i) => (
                                                <div key={i} className="flex flex-col items-center">
                                                    {isSimulating && (
                                                        <div className="flex flex-col mb-1.5 animate-in slide-in-from-bottom-2">
                                                            <button onClick={() => handleScoreChange(m.id, 1)} className="text-blue-400 hover:text-blue-300 transition-transform active:scale-125 p-0.5"><ChevronUp size={18}/></button>
                                                            <button onClick={() => handleScoreChange(m.id, -1)} className="text-blue-400 hover:text-blue-300 transition-transform active:scale-125 -mt-1 p-0.5"><ChevronDown size={18}/></button>
                                                        </div>
                                                    )}
                                                    <div className={`flex flex-col items-center justify-center min-w-[64px] p-2.5 rounded-2xl border transition-all duration-300 ${getStyles(m.currentPercent)} ${isSimulating ? 'ring-2 ring-blue-500/50 scale-105 shadow-lg shadow-blue-500/10' : ''}`}>
                                                        <span className="text-[9px] font-black opacity-60 uppercase mb-1">{m.type}</span>
                                                        <span className="text-base font-black tabular-nums">{m.currentVal}/{m.maxVal}</span>
                                                        <span className="text-[10px] font-bold opacity-50 mt-0.5">{Math.round(m.currentPercent)}%</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </td>

                                    <td className={`text-center font-black text-lg ${getStyles(row.avgFO).split(' ')[0]}`}>{row.avgFO !== null ? Math.round(row.avgFO)+'%' : '-'}</td>
                                    <td className={`text-center font-black text-lg ${getStyles(row.avgBJB).split(' ')[0]}`}>{row.avgBJB !== null ? Math.round(row.avgBJB)+'%' : '-'}</td>
                                    <td className={`text-center font-black text-lg ${getStyles(row.avgTJB).split(' ')[0]}`}>{row.avgTJB !== null ? Math.round(row.avgTJB)+'%' : '-'}</td>

                                    <td className="text-center">
                                        <div className={`text-3xl font-black drop-shadow-sm ${getStyles(row.totalAvg).split(' ')[0]}`}>
                                            {row.totalAvg}%
                                        </div>
                                    </td>

                                    <td className="px-8 py-8 text-center">
                                        <div className={`w-16 h-16 mx-auto rounded-[1.25rem] flex items-center justify-center text-3xl font-black shadow-2xl transition-all duration-500 ${
                                            row.grade === 5 ? 'bg-green-500 text-slate-900 shadow-green-500/30 rotate-3' :
                                                row.grade === 4 ? 'bg-yellow-400 text-slate-900 shadow-yellow-400/30' :
                                                    'bg-red-500 text-white shadow-red-500/30 -rotate-3'
                                        }`}>
                                            {row.grade}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="7" className="py-40 text-center"><Inbox className="mx-auto mb-4 opacity-10" size={80}/> <p className="text-slate-500 font-bold text-xl">Бұл тоқсанда бағалар жоқ</p></td></tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;