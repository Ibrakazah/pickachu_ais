import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    LayoutDashboard, Calendar, BookOpen, Bell, User,
    Award, Loader, Pencil, ChevronUp, ChevronDown, Inbox
} from 'lucide-react';

const Dashboard = () => {
    const [studentName, setStudentName] = useState('Оқушы');
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuarter, setSelectedQuarter] = useState(1);

    // Режим редактора
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulatedOffsets, setSimulatedOffsets] = useState({});

    useEffect(() => {
        const name = localStorage.getItem('studentName');
        if (name) setStudentName(name);
    }, []);

    useEffect(() => {
        fetchGrades(selectedQuarter);
        setSimulatedOffsets({});
    }, [selectedQuarter]);

    const fetchGrades = async (quarter) => {
        setLoading(true);
        setTableData([]);
        try {
            const response = await axios.get(`http://localhost:8000/api/v1/grades/quarter?period=${quarter}`);
            if (response.data && response.data.status === 'success') {
                setTableData(response.data.table || []);
            }
        } catch (error) {
            setTableData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleScoreChange = (id, delta) => {
        setSimulatedOffsets(prev => ({
            ...prev,
            [id]: (prev[id] || 0) + delta
        }));
    };

    const processedData = useMemo(() => {
        return tableData.map((subject) => {
            const simulatedMarks = (subject.marks || []).map((m, mIdx) => {
                const id = `${subject.subject_name}-${m.type}-${mIdx}`;
                const offset = simulatedOffsets[id] || 0;
                const maxVal = m.max > 0 ? m.max : (m.raw_val || 10);
                const currentVal = Math.max(0, Math.min(maxVal, m.raw_val + offset));
                const currentPercent = (currentVal / maxVal) * 100;
                return { ...m, currentVal, currentPercent, id, maxVal };
            });

            const getAvg = (type) => {
                const filtered = simulatedMarks.filter(m => m.type === type);
                if (!filtered.length) return null;
                return filtered.reduce((acc, curr) => acc + curr.currentPercent, 0) / filtered.length;
            };

            const avgFO = getAvg('ФО');
            const avgBJB = getAvg('БЖБ');
            const avgTJB = getAvg('ТЖБ');

            let totalAvg = 0;
            let fo_bjb_combined = 0;

            if (avgFO !== null && avgBJB !== null) {
                fo_bjb_combined = (avgFO + avgBJB) / 2;
            } else {
                fo_bjb_combined = avgFO ?? avgBJB ?? 0;
            }

            if (avgTJB !== null) {
                totalAvg = (avgTJB * 0.5) + (fo_bjb_combined * 0.5);
            } else {
                totalAvg = fo_bjb_combined;
            }

            const finalP = Math.round(totalAvg);
            let grade = 3;
            if (finalP >= 85) grade = 5;
            else if (finalP >= 65) grade = 4;

            return { ...subject, simulatedMarks, avgFO, avgBJB, avgTJB, totalAvg: finalP, grade };
        });
    }, [tableData, simulatedOffsets]);

    const getStyles = (p) => {
        if (p === null || p === undefined) return "text-slate-600 border-white/5 bg-white/5";
        if (p >= 85) return "text-green-400 border-green-500/30 bg-green-500/10";
        if (p >= 79) return "text-emerald-500/70 border-emerald-500/20 bg-emerald-500/5";
        if (p >= 65) return "text-orange-400 border-orange-500/30 bg-orange-500/10";
        return "text-red-400 border-red-500/30 bg-red-500/10";
    };

    const navItems = [
        { icon: Calendar, label: 'Күнделік', active: true },
        { icon: BookOpen, label: 'Пәндер', active: false },
        { icon: Bell, label: 'Хабарлама', active: false },
        { icon: User, label: 'Профиль', active: false },
    ];

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans pb-10">
            {/* NAV BAR */}
            <nav className="sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center shadow-lg shadow-yellow-400/20">
                            <Award className="text-slate-900 w-5 h-5" />
                        </div>
                        <span className="font-black text-xl text-white tracking-tight italic">Picka<span className="text-yellow-400">chu</span></span>
                    </div>

                    <div className="hidden lg:flex space-x-2">
                        {navItems.map((item, i) => (
                            <button key={i} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${item.active ? 'bg-white/10 text-yellow-400' : 'text-slate-500 hover:text-white'}`}>
                                <item.icon size={18} /> {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => { setIsSimulating(!isSimulating); if(isSimulating) setSimulatedOffsets({}); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${isSimulating ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'}`}
                        >
                            <Pencil size={16} />
                            {isSimulating ? 'Сақтау' : 'Редактор'}
                        </button>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center text-slate-900 font-bold shadow-lg">
                            {studentName.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-screen-2xl mx-auto px-6 mt-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight italic uppercase">Ведомость по оценкам</h1>
                        <p className="text-slate-500 mt-1 font-medium">Оценки из BilimClass</p>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 w-fit">
                        {[1, 2, 3, 4].map(q => (
                            <button key={q} onClick={() => setSelectedQuarter(q)} className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${selectedQuarter === q ? 'bg-yellow-400 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}>{q}-тоқсан</button>
                        ))}
                    </div>
                </div>

                <div className="bg-white/[0.02] rounded-[2.5rem] border border-white/10 overflow-x-auto shadow-2xl backdrop-blur-sm">
                    <table className="w-full text-sm min-w-[1000px]">
                        <thead>
                        <tr className="text-[10px] uppercase text-slate-500 font-bold tracking-[0.2em] border-b border-white/10 bg-white/[0.01]">
                            <th className="px-8 py-5 text-left">Пән атауы</th>
                            <th className="px-8 py-5 text-center">Бағалар</th>
                            <th className="w-24 text-center">%ФБ</th>
                            <th className="w-24 text-center">%БЖБ</th>
                            <th className="w-24 text-center">%ТЖБ</th>
                            <th className="w-28 text-center text-yellow-400 italic">БОЛЖАМ %</th>
                            <th className="w-32 text-center font-black">БАҒА</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan="7" className="py-40 text-center"><Loader className="w-10 h-10 text-yellow-400 animate-spin mx-auto" /></td></tr>
                        ) : processedData.length ? processedData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                                <td className="px-8 py-7 text-left font-bold text-white text-base leading-tight">{row.subject_name}</td>

                                <td className="px-8 py-7">
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {row.simulatedMarks.map((m, i) => (
                                            <div key={i} className="flex flex-col items-center">
                                                {isSimulating && (
                                                    <div className="flex flex-col mb-1 animate-in slide-in-from-bottom-1">
                                                        <button onClick={() => handleScoreChange(m.id, 1)} className="text-blue-400 hover:text-blue-300 transition-transform active:scale-125"><ChevronUp size={16} /></button>
                                                        <button onClick={() => handleScoreChange(m.id, -1)} className="text-blue-400 hover:text-blue-300 transition-transform active:scale-125 -mt-1"><ChevronDown size={16} /></button>
                                                    </div>
                                                )}
                                                <div className={`flex flex-col items-center justify-center min-w-[58px] p-2.5 rounded-2xl border transition-all duration-300 ${getStyles(m.currentPercent)} ${isSimulating ? 'ring-2 ring-blue-500/40 scale-105' : ''}`}>
                                                    <span className="text-[8px] font-black opacity-50 uppercase mb-0.5">{m.type}</span>
                                                    <span className="text-sm font-bold tabular-nums">{m.currentVal}/{m.maxVal}</span>
                                                    <span className="text-[9px] font-medium opacity-40">{Math.round(m.currentPercent)}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </td>

                                <td className={`text-center font-bold text-base ${getStyles(row.avgFO).split(' ')[0]}`}>{row.avgFO !== null ? Math.round(row.avgFO)+'%' : '-'}</td>
                                <td className={`text-center font-bold text-base ${getStyles(row.avgBJB).split(' ')[0]}`}>{row.avgBJB !== null ? Math.round(row.avgBJB)+'%' : '-'}</td>
                                <td className={`text-center font-bold text-base ${getStyles(row.avgTJB).split(' ')[0]}`}>{row.avgTJB !== null ? Math.round(row.avgTJB)+'%' : '-'}</td>

                                <td className="text-center">
                                    <div className={`text-2xl font-black ${getStyles(row.totalAvg).split(' ')[0]}`}>
                                        {row.totalAvg}%
                                    </div>
                                </td>

                                <td className="px-8 py-7 text-center">
                                    <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl transition-all duration-500 ${
                                        row.grade === 5 ? 'bg-green-500 text-slate-900 shadow-green-500/20' :
                                            row.grade === 4 ? 'bg-yellow-400 text-slate-900 shadow-yellow-400/20' :
                                                'bg-red-500 text-white shadow-red-500/20'
                                    }`}>
                                        {row.grade}
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="7" className="py-40 text-center text-slate-500 italic"><Inbox className="mx-auto mb-2 opacity-10" size={64} /> Мәлімет табылмады</td></tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;