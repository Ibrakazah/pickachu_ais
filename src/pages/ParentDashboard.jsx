import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, LogOut, BookOpen, User, LineChart as ChartIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ParentDashboard = () => {
    const navigate = useNavigate();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    // Для родителя (чтобы не было путаницы с его именем, просто пишем "вашего ребенка")
    const studentName = 'вашего ребенка'; 

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/v1/parent/report', {
                    headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
                });
                if (res.data.status === 'success') {
                    setReportData({
                        ai_report: res.data.ai_report,
                        grades: res.data.grades,
                        quarters_avg: res.data.quarters_avg
                    });
                }
            } catch (err) {
                console.error("Failed to load report", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, []);

    const handleLogout = () => {
        sessionStorage.clear();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-300 font-sans pb-12">
            {/* Header */}
            <header className="bg-slate-900 border-b border-emerald-900/30 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <User className="text-emerald-400 w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">Кабинет Родителя</h1>
                            <p className="text-xs text-emerald-400 font-medium">Aqbobek Lyceum</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700 hover:border-slate-600"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Шығу</span>
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                {/* Title */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Успеваемость {studentName}</h2>
                    <p className="text-slate-400">Аналитика и еженедельный ИИ-отчет от куратора</p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-slate-800/50 rounded-2xl border border-emerald-900/30">
                        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-emerald-400 animate-pulse font-medium">Анализируем оценки с помощью Gemini AI...</p>
                    </div>
                ) : reportData ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* ИИ Отчет */}
                        <div className="lg:col-span-1 space-y-8">
                            <div className="bg-slate-800/80 rounded-3xl p-6 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.05)] relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] -mr-10 -mt-10"></div>
                                
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                        <Sparkles className="text-white w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">ИИ-Куратор</h3>
                                        <p className="text-sm text-emerald-400">Gemini 2.0 Анализ</p>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-700/50 backdrop-blur-sm">
                                    <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-line">
                                        {reportData.ai_report}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Таблица и График */}
                        <div className="lg:col-span-2 space-y-8">
                            
                            {/* График */}
                            <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/50 hidden md:block">
                                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <ChartIcon className="text-emerald-400 w-5 h-5" />
                                    Динамика среднего балла (по четвертям)
                                </h3>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={reportData.quarters_avg} margin={{ top: 15, right: 20, bottom: 5, left: -20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                            <XAxis dataKey="quarter" stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
                                            <YAxis domain={[0, 10]} stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
                                            <Tooltip 
                                                cursor={{stroke: '#10b981', strokeWidth: 1, strokeDasharray: '3 3', fill: 'transparent'}}
                                                contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff'}}
                                            />
                                            <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={4} dot={{r: 6, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2}} activeDot={{r: 8, fill: '#059669', stroke: '#fff'}} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Таблица */}
                            <div className="bg-slate-800/80 rounded-3xl overflow-hidden border border-slate-700/50">
                                <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <BookOpen className="text-emerald-400 w-5 h-5" />
                                        Текущие оценки
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold">Предмет</th>
                                                <th className="px-6 py-4 font-semibold text-center">Оценка (из 10)</th>
                                                <th className="px-6 py-4 font-semibold text-center">Статус</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700/50">
                                            {reportData.grades.map((g, idx) => (
                                                <tr key={idx} className="hover:bg-slate-700/20 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-white">{g.subject}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 font-bold text-emerald-400">
                                                            {g.score}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {g.score >= 8 ? (
                                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Отлично</span>
                                                        ) : g.score >= 5 ? (
                                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Хорошо</span>
                                                        ) : (
                                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">Внимание</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="text-center text-slate-500 py-12">Нет данных для отображения</div>
                )}
            </main>
        </div>
    );
};

export default ParentDashboard;
