import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Home, Calendar, BookOpen, Briefcase, Award, Settings,
    Terminal, Code, Zap, Trophy, ExternalLink, Plus, FolderOpen, X, Trash2, Link, LayoutDashboard
} from 'lucide-react';

const Portfolio = () => {
    const navigate = useNavigate();

    // --- СОСТОЯНИЯ ПРОФИЛЯ ---
    const [studentName, setStudentName] = useState('Оқушы');
    const [className, setClassName] = useState('');
    const [subgroup, setSubgroup] = useState('');

    // --- СОСТОЯНИЯ ДАННЫХ ---
    const [projects, setProjects] = useState([]);
    const [skills, setSkills] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // --- ФОРМЫ ДОБАВЛЕНИЯ ---
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newLink1, setNewLink1] = useState('');
    const [newLink2, setNewLink2] = useState('');
    const [skillInput, setSkillInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. Инициализация
    useEffect(() => {
        const savedName = sessionStorage.getItem('studentName');
        if (!savedName) {
            navigate('/');
        } else {
            setStudentName(savedName);
            setClassName(sessionStorage.getItem('className') || '10 A');
            setSubgroup(sessionStorage.getItem('subgroup') || '1-группа');
            fetchAllData();
        }
    }, [navigate]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Загружаем проекты и навыки параллельно
            const [projRes, skillRes] = await Promise.all([
                axios.get('http://localhost:8000/api/v1/portfolio/projects'),
                axios.get('http://localhost:8000/api/v1/portfolio/skills')
            ]);

            if (projRes.data.status === 'success') setProjects(projRes.data.projects);
            if (skillRes.data.status === 'success') setSkills(skillRes.data.skills);
        } catch (e) {
            console.error("Деректерді жүктеу қатесі:", e);
        } finally {
            setLoading(false);
        }
    };

    // --- ЛОГИКА ПРОЕКТОВ ---
    const handleAddProject = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await axios.post('http://localhost:8000/api/v1/portfolio/add_project', {
                title: newTitle,
                description: newDesc,
                link1: newLink1,
                link2: newLink2
            });
            if (res.data.status === 'success') {
                setIsModalOpen(false);
                setNewTitle(''); setNewDesc(''); setNewLink1(''); setNewLink2('');
                fetchAllData(); // Обновляем список
            }
        } catch (e) {
            console.error("Жоба қосу қатесі:", e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveProject = async (projectId) => {
        try {
            const res = await axios.delete(`http://localhost:8000/api/v1/portfolio/remove_project?project_id=${projectId}`);
            if (res.data.status === 'success') fetchAllData();
        } catch (e) {
            console.error("Жобаны өшіру қатесі:", e);
        }
    };

    // --- ЛОГИКА НАВЫКОВ ---
    const handleAddSkill = async (e) => {
        if (e) e.preventDefault();
        if (!skillInput.trim()) return;

        try {
            const res = await axios.post(`http://localhost:8000/api/v1/portfolio/add_skill?skill=${encodeURIComponent(skillInput.trim())}`);
            if (res.data.status === 'success') {
                setSkillInput('');
                fetchAllData();
            }
        } catch (e) {
            console.error("Дағды қосу қатесі:", e);
        }
    };

    const handleRemoveSkill = async (skillName) => {
        try {
            const res = await axios.delete(`http://localhost:8000/api/v1/portfolio/remove_skill?skill=${encodeURIComponent(skillName)}`);
            if (res.data.status === 'success') {
                fetchAllData();
            }
        } catch (e) {
            console.error("Дағдыны өшіру қатесі:", e);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 pb-20 font-sans relative">
            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

            {/* МОДАЛЬНОЕ ОКНО ДОБАВЛЕНИЯ ПРОЕКТА */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#1e293b] border border-white/10 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center p-8 border-b border-white/5 bg-white/[0.02]">
                            <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                <Plus className="text-blue-400" size={28}/> Жаңа жоба қосу
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                                <X size={24}/>
                            </button>
                        </div>

                        <form onSubmit={handleAddProject} className="p-8 space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block ml-1">Жоба атауы</label>
                                <input required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} type="text" placeholder="Мысалы: Smart Water Monitor" className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600" />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block ml-1">Сипаттамасы</label>
                                <textarea required value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows="3" placeholder="Жобаңыздың мақсаты мен технологиялары..." className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600 resize-none"></textarea>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block ml-1">Сілтеме 1</label>
                                    <div className="relative">
                                        <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input value={newLink1} onChange={(e) => setNewLink1(e.target.value)} type="url" placeholder="https://..." className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm placeholder:text-slate-600" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block ml-1">Сілтеме 2</label>
                                    <div className="relative">
                                        <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input value={newLink2} onChange={(e) => setNewLink2(e.target.value)} type="url" placeholder="https://..." className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm placeholder:text-slate-600" />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-50">
                                {isSubmitting ? 'Сақталуда...' : 'Жобаны сақтау'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* НАВИГАЦИЯ */}
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
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5">
                        <BookOpen size={18}/> Пәндер
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all bg-white/10 text-yellow-400 shadow-md">
                        <Briefcase size={18}/> Портфолио
                    </button>
                    <button onClick={() => navigate('/schedule')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all text-slate-400 hover:text-white hover:bg-white/5">
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* ЛЕВАЯ КОЛОНКА */}
                    <div className="space-y-8">
                        {/* Профиль */}
                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-center relative overflow-hidden shadow-2xl backdrop-blur-sm">
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>
                            <div className="relative z-10">
                                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center text-slate-900 font-black text-5xl shadow-xl shadow-yellow-500/20 mb-6 border-4 border-[#0f172a]">
                                    {studentName.charAt(0).toUpperCase()}
                                </div>
                                <h1 className="text-3xl font-black text-white tracking-tight">{studentName}</h1>
                                <p className="text-slate-400 font-medium mt-1 uppercase text-xs tracking-widest">{className} оқушысы</p>

                                <div className="grid grid-cols-2 gap-4 mt-8">
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                        <div className="text-yellow-400 font-black text-2xl">4.8</div>
                                        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">GPA</div>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                        <div className="text-blue-400 font-black text-2xl">{projects.length}</div>
                                        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Жоба</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ДИНАМИЧЕСКИЕ НАВЫКИ */}
                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 shadow-xl backdrop-blur-sm">
                            <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                                <Zap className="text-yellow-400" size={24}/> Кәсіби дағдылар
                            </h2>

                            {/* Поле ввода нового навыка */}
                            <form onSubmit={handleAddSkill} className="flex gap-2 mb-6">
                                <input
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    placeholder="Мысалы: React"
                                    className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-yellow-400/30 transition-all"
                                />
                                <button type="submit" className="p-2.5 bg-yellow-400 text-slate-900 rounded-xl hover:scale-105 active:scale-95 transition-all">
                                    <Plus size={20} />
                                </button>
                            </form>

                            {/* Список навыков */}
                            <div className="flex flex-wrap gap-2.5">
                                {skills.length > 0 ? skills.map((skill, idx) => (
                                    <div key={idx} className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-slate-300 hover:border-yellow-400/50 hover:bg-yellow-400/5 transition-all">
                                        {skill}
                                        <button onClick={() => handleRemoveSkill(skill)} className="text-slate-500 hover:text-red-400 transition-colors">
                                            <X size={14} />
                                        </button>
                                    </div>
                                )) : (
                                    <p className="text-slate-600 text-xs italic ml-1">Әзірге дағдылар қосылмаған</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ПРАВАЯ КОЛОНКА */}
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <div className="flex justify-between items-end mb-8 ml-2">
                                <div>
                                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase flex items-center gap-4">
                                        <Code className="text-blue-400" size={36}/> Менің жобаларым
                                    </h2>
                                    <p className="text-slate-500 font-medium mt-1">Тәжірибе мен инновациялар жинағы</p>
                                </div>
                                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 active:scale-95">
                                    <Plus size={20}/> Жоба қосу
                                </button>
                            </div>

                            {projects.length === 0 ? (
                                <div className="bg-white/[0.02] border-2 border-white/5 border-dashed rounded-[3rem] py-24 flex flex-col items-center justify-center text-center animate-in fade-in duration-1000">
                                    <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 text-slate-600">
                                        <FolderOpen size={48} />
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-2">Портфолио бос</h3>
                                    <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">Сіз әлі ешқандай жоба қосқан жоқсыз. Өз жетістіктеріңізді көрсету үшін алғашқы жобаңызды қосыңыз.</p>
                                    <button onClick={() => setIsModalOpen(true)} className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition-all border border-white/10">
                                        Жобаны қосуды бастау
                                    </button>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-8">
                                    {projects.map((project, index) => (
                                        <div key={index} className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/[0.06] transition-all group relative overflow-hidden flex flex-col shadow-lg hover:shadow-2xl hover:-translate-y-1 duration-300">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors"></div>

                                            <div className="flex justify-between items-start mb-8 z-10 block">
                                                <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg ${index % 2 === 0 ? 'bg-blue-500/20 text-blue-400 shadow-blue-500/10' : 'bg-purple-500/20 text-purple-400 shadow-purple-500/10'}`}>
                                                    <Terminal size={32}/>
                                                </div>
                                                <button onClick={() => handleRemoveProject(project.id)} className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all border border-transparent hover:border-red-400/20">
                                                    <Trash2 size={20}/>
                                                </button>
                                            </div>

                                            <h3 className="text-2xl font-black text-white mb-3 tracking-tight leading-tight z-10">{project.title}</h3>
                                            <p className="text-slate-400 text-base mb-8 leading-relaxed flex-grow line-clamp-4 z-10">{project.description}</p>

                                            <div className="flex gap-4 mt-auto">
                                                {project.link1 ? (
                                                    <a href={project.link1} target="_blank" rel="noreferrer" className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-black text-sm flex justify-center items-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/10">
                                                        <ExternalLink size={18}/> Сілтеме 1
                                                    </a>
                                                ) : (
                                                    <div className="flex-1 py-4 rounded-2xl bg-slate-800/50 text-slate-600 font-bold text-xs flex justify-center items-center gap-2 cursor-not-allowed border border-white/5">
                                                        Сілтеме жоқ
                                                    </div>
                                                )}

                                                {project.link2 && (
                                                    <a href={project.link2} target="_blank" rel="noreferrer" className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all group-hover:border-blue-500/30">
                                                        <Link size={20}/>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Portfolio;
