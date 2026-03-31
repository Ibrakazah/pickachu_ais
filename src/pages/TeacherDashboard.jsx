import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Calendar, UserCheck, LogOut, CheckCircle, Clock, AlertTriangle, TrendingDown, Users, ShieldAlert, BarChart2, Activity } from 'lucide-react';
import { Toaster, toast } from 'sonner';

const API = 'http://localhost:8000';
const QUARTERS = [1, 2, 3, 4];
const GRADE_TYPES = ['ФО', 'СОЧ', 'СОР'];

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('schedule');

    // Schedule
    const [scheduleData, setScheduleData] = useState(null);
    const [loadingSchedule, setLoadingSchedule] = useState(true);

    // Journal
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedQuarter, setSelectedQuarter] = useState(4);
    const [selectedGradeType, setSelectedGradeType] = useState('ФО');
    const [students, setStudents] = useState([]);
    const [gradeInputs, setGradeInputs] = useState({});
    // { student_id: { hasSoch: bool, marks: [] } }
    const [studentMarks, setStudentMarks] = useState({});

    // Analytics
    const [analytics, setAnalytics] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    const [availableClasses, setAvailableClasses] = useState([]);
    const [availableSubjects, setAvailableSubjects] = useState([]);

    const teacherName = sessionStorage.getItem('studentName') || 'Учитель';
    const authHeader = { Authorization: `Bearer ${sessionStorage.getItem('token')}` };

    // ─── Fetch schedule ───────────────────────────────────────────────────────
    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const res = await axios.get(`${API}/api/v1/teacher/my-schedule`, { headers: authHeader });
                if (res.data.status === 'success') {
                    setScheduleData(res.data.schedule);
                    const classes = new Set();
                    const subjects = new Set();
                    Object.values(res.data.schedule).forEach(dayLessons => {
                        dayLessons.forEach(l => {
                            if (l) { classes.add(l.class); subjects.add(l.subject); }
                        });
                    });
                    setAvailableClasses(Array.from(classes));
                    setAvailableSubjects(Array.from(subjects));
                }
            } catch (err) {
                console.error('Ошибка загрузки расписания', err);
            } finally {
                setLoadingSchedule(false);
            }
        };
        fetchSchedule();
    }, []);

    // ─── Fetch students when class changes ────────────────────────────────────
    useEffect(() => {
        if (!selectedClass) { setStudents([]); return; }
        const fetchStudents = async () => {
            try {
                const res = await axios.get(`${API}/api/v1/teacher/my-students?class_name=${selectedClass}`, { headers: authHeader });
                if (res.data.status === 'success') setStudents(res.data.students);
            } catch (err) { console.error('Ошибка загрузки учеников', err); }
        };
        fetchStudents();
    }, [selectedClass]);

    // ─── Fetch marks for each student when subject/quarter changes ────────────
    const fetchStudentMarks = useCallback(async () => {
        if (!selectedSubject || !students.length) return;
        const results = {};
        await Promise.all(students.map(async (student) => {
            try {
                const res = await axios.get(
                    `${API}/api/v1/teacher/student-grades`,
                    { params: { student_id: student.id, subject: selectedSubject, quarter: selectedQuarter }, headers: authHeader }
                );
                if (res.data.status === 'success') {
                    const marks = res.data.marks || [];
                    const hasSoch = marks.some(m => m.type === 'СОЧ');
                    results[student.id] = { marks, hasSoch };
                }
            } catch (_) { results[student.id] = { marks: [], hasSoch: false }; }
        }));
        setStudentMarks(results);
    }, [selectedSubject, selectedQuarter, students]);

    useEffect(() => { fetchStudentMarks(); }, [fetchStudentMarks]);

    // ─── Fetch analytics (filtered by teacher's own subjects) ─────────────────
    const fetchAnalytics = useCallback(async () => {
        setAnalyticsLoading(true);
        try {
            // Передаём предметы учителя как фильтр
            const subjectsParam = availableSubjects.length
                ? `?subjects=${encodeURIComponent(availableSubjects.join(','))}`
                : '';
            const res = await axios.get(`${API}/api/v1/teacher/early_warning${subjectsParam}`, { headers: authHeader });
            if (res.data.status === 'success') setAnalytics(res.data);
        } catch (e) { console.error(e); }
        finally { setAnalyticsLoading(false); }
    }, [availableSubjects]);

    useEffect(() => {
        if (activeTab === 'analytics') fetchAnalytics();
    }, [activeTab, fetchAnalytics]);

    // ─── Handlers ─────────────────────────────────────────────────────────────
    const handleLogout = () => { sessionStorage.clear(); navigate('/'); };

    const handleInputChange = (studentId, field, value) => {
        setGradeInputs(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));
    };

    const handleSubmitGrade = async (studentId, studentName) => {
        const val = gradeInputs[studentId];
        if (!val?.grade) { toast.error('Пожалуйста, введите оценку (0–10)'); return; }
        if (!selectedSubject) { toast.error('Пожалуйста, выберите предмет'); return; }

        const isUpdatingSoch = selectedGradeType === 'СОЧ' && studentMarks[studentId]?.hasSoch;

        try {
            const res = await axios.post(`${API}/api/v1/teacher/add-grade`, {
                student_id: studentId,
                subject: selectedSubject,
                grade: parseInt(val.grade),
                comment: val.comment || '',
                quarter: selectedQuarter,
                grade_type: selectedGradeType,
            }, { headers: authHeader });

            if (res.data.status === 'success') {
                const action = isUpdatingSoch ? 'обновлён' : 'выставлен';
                toast.success(`${selectedGradeType} за ${selectedQuarter}-ч. ${action} для ${studentName}!`);
                setGradeInputs(prev => ({ ...prev, [studentId]: { grade: '', comment: '' } }));
                fetchStudentMarks();
            } else {
                toast.error('Ошибка: ' + res.data.message);
            }
        } catch (err) {
            toast.error('Сетевая ошибка при выставлении оценки');
            console.error(err);
        }
    };

    // ─── Type badge colors ─────────────────────────────────────────────────────
    const typeBadgeClass = (type) => {
        if (type === 'СОЧ') return 'bg-purple-100 text-purple-700 border border-purple-200';
        if (type === 'СОР') return 'bg-amber-100 text-amber-700 border border-amber-200';
        return 'bg-blue-100 text-blue-700 border border-blue-200';
    };

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
            <Toaster position="top-right" richColors />

            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center border border-blue-200">
                            <span className="text-blue-600 font-bold text-lg">{teacherName.charAt(0)}</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900">Учитель: {teacherName}</h1>
                            <p className="text-xs text-blue-600 font-medium">Aqbobek Lyceum</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all border border-slate-200"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Шығу</span>
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                {/* Tabs */}
                <div className="flex space-x-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 mb-8 w-fit">
                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'schedule' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                    >
                        <Calendar className="w-4 h-4" /> Мое Расписание
                    </button>
                    <button
                        onClick={() => setActiveTab('journal')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'journal' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                    >
                        <UserCheck className="w-4 h-4" /> Теневой Журнал
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'analytics' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                    >
                        <ShieldAlert className="w-4 h-4" /> Аналитика рисков
                    </button>
                </div>

                {loadingSchedule ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {/* ── TAB: SCHEDULE ── */}
                        {activeTab === 'schedule' && (
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-6 border-b border-slate-100">
                                    <h2 className="text-xl font-bold text-slate-900">Расписание на неделю</h2>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-6">
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                                        <div key={day} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                            <h3 className="font-bold text-slate-700 mb-4 border-b border-slate-200 pb-2">
                                                {day === 'Monday' ? 'Дүйсенбі' : day === 'Tuesday' ? 'Сейсенбі' : day === 'Wednesday' ? 'Сәрсенбі' : day === 'Thursday' ? 'Бейсенбі' : 'Жұма'}
                                            </h3>
                                            <div className="space-y-3">
                                                {scheduleData && scheduleData[day] && scheduleData[day].length > 0 ? (
                                                    scheduleData[day].map((lesson, idx) => (
                                                        lesson ? (
                                                            <div
                                                                key={idx}
                                                                onClick={() => { setSelectedClass(lesson.class); setSelectedSubject(lesson.subject); setActiveTab('journal'); }}
                                                                className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group mb-3"
                                                            >
                                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 group-hover:bg-blue-600"></div>
                                                                <div className="flex items-center text-xs text-slate-400 mb-1 font-medium group-hover:text-blue-500 transition-colors">
                                                                    <Clock className="w-3 h-3 mr-1" /> {lesson.time}
                                                                </div>
                                                                <div className="font-bold text-slate-800 mb-1">{lesson.subject}</div>
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold group-hover:bg-blue-100 transition-colors">{lesson.class}</span>
                                                                    <span className="text-slate-400">Каб: {lesson.room}</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div key={idx} className="bg-slate-100/60 p-3 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center opacity-70 mb-3 min-h-[96px]">
                                                                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Окно</span>
                                                            </div>
                                                        )
                                                    ))
                                                ) : (
                                                    <div className="text-sm text-slate-400 italic text-center py-4">Нет уроков</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── TAB: JOURNAL ── */}
                        {activeTab === 'journal' && (
                            <div className="space-y-6">
                                {/* Filters */}
                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                                    <h2 className="text-base font-bold text-slate-700 mb-5">Параметры журнала</h2>
                                    <div className="flex flex-wrap gap-6 items-end">
                                        {/* Subject */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Предмет</label>
                                            <select
                                                value={selectedSubject}
                                                onChange={(e) => setSelectedSubject(e.target.value)}
                                                className="bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5 outline-none font-medium"
                                            >
                                                <option value="">-- Выберите --</option>
                                                {availableSubjects.map((subj, idx) => (
                                                    <option key={idx} value={subj}>{subj}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Class */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Класс</label>
                                            <select
                                                value={selectedClass}
                                                onChange={(e) => setSelectedClass(e.target.value)}
                                                className="bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5 outline-none font-medium"
                                            >
                                                <option value="">-- Выберите --</option>
                                                {availableClasses.map((cls, idx) => (
                                                    <option key={idx} value={cls}>{cls}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Quarter */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Четверть</label>
                                            <div className="flex gap-2">
                                                {QUARTERS.map(q => (
                                                    <button
                                                        key={q}
                                                        onClick={() => setSelectedQuarter(q)}
                                                        className={`w-10 h-10 rounded-xl text-sm font-bold border transition-all ${selectedQuarter === q ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-400'}`}
                                                    >
                                                        {q}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Grade Type */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Тип оценки</label>
                                            <div className="flex gap-2">
                                                {GRADE_TYPES.map(type => (
                                                    <button
                                                        key={type}
                                                        onClick={() => setSelectedGradeType(type)}
                                                        className={`px-4 h-10 rounded-xl text-sm font-bold border transition-all ${selectedGradeType === type
                                                            ? type === 'СОЧ' ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                                                                : type === 'СОР' ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                                                                    : 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400'}`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* СОЧ info */}
                                    {selectedGradeType === 'СОЧ' && (
                                        <div className="mt-4 flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2 w-fit">
                                            <AlertTriangle className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                            <span className="text-xs font-semibold text-purple-700">Максимум 1 СОЧ за четверть. Если он уже есть — значение будет обновлено.</span>
                                        </div>
                                    )}
                                </div>

                                {/* Students List */}
                                {selectedClass ? (
                                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                            <h2 className="text-xl font-bold text-slate-900">
                                                Ученики класса {selectedClass}
                                                <span className="ml-3 text-sm font-medium text-slate-400">
                                                    · {selectedQuarter}-четверть · {selectedGradeType}
                                                </span>
                                            </h2>
                                        </div>
                                        <div className="p-0">
                                            <table className="w-full text-left text-sm text-slate-600">
                                                <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold">
                                                    <tr>
                                                        <th className="px-6 py-4">Ученик</th>
                                                        <th className="px-6 py-4">Оценки за {selectedQuarter}-ч.</th>
                                                        <th className="px-6 py-4">Новая оценка (0–10)</th>
                                                        <th className="px-6 py-4 w-1/4">Комментарий</th>
                                                        <th className="px-6 py-4 text-center">Действие</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {students.length > 0 ? students.map((student, idx) => {
                                                        const info = studentMarks[student.id] || { marks: [], hasSoch: false };
                                                        const isUpdatingSoch = selectedGradeType === 'СОЧ' && info.hasSoch;

                                                        return (
                                                            <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                                <td className="px-6 py-4 font-bold text-slate-800">
                                                                    {idx + 1}. {student.name}
                                                                </td>

                                                                {/* Existing marks for this quarter */}
                                                                <td className="px-6 py-4">
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {info.marks.length > 0 ? info.marks.map((m, mi) => (
                                                                            <span key={mi} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${typeBadgeClass(m.type)}`}>
                                                                                <span className="opacity-70">{m.type}</span>
                                                                                <span>{m.raw_val}</span>
                                                                            </span>
                                                                        )) : (
                                                                            <span className="text-slate-400 text-xs italic">Оценок нет</span>
                                                                        )}
                                                                    </div>
                                                                </td>

                                                                {/* New grade input */}
                                                                <td className="px-6 py-4">
                                                                    <input
                                                                        type="number"
                                                                        min="0" max="10"
                                                                        placeholder={isUpdatingSoch ? 'Новое значение' : '0'}
                                                                        className="w-20 bg-white border border-slate-300 text-slate-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-2 outline-none font-bold text-center"
                                                                        value={gradeInputs[student.id]?.grade || ''}
                                                                        onChange={(e) => handleInputChange(student.id, 'grade', e.target.value)}
                                                                    />
                                                                </td>

                                                                {/* Comment */}
                                                                <td className="px-6 py-4">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Комментарий..."
                                                                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-2 outline-none font-medium"
                                                                        value={gradeInputs[student.id]?.comment || ''}
                                                                        onChange={(e) => handleInputChange(student.id, 'comment', e.target.value)}
                                                                    />
                                                                </td>

                                                                {/* Action */}
                                                                <td className="px-6 py-4 text-center">
                                                                    <button
                                                                        onClick={() => handleSubmitGrade(student.id, student.name)}
                                                                        className={`inline-flex items-center gap-2 font-bold py-2 px-4 rounded-xl transition-colors text-white ${
                                                                            isUpdatingSoch ? 'bg-purple-500 hover:bg-purple-600'
                                                                            : selectedGradeType === 'СОЧ' ? 'bg-purple-600 hover:bg-purple-700'
                                                                            : selectedGradeType === 'СОР' ? 'bg-amber-500 hover:bg-amber-600'
                                                                            : 'bg-blue-600 hover:bg-blue-700'}`}
                                                                    >
                                                                        <CheckCircle className="w-4 h-4" />
                                                                        {isUpdatingSoch ? 'Обновить СОЧ' : 'Выставить'}
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    }) : (
                                                        <tr>
                                                            <td colSpan="5" className="px-6 py-8 text-center text-slate-400 font-medium">
                                                                В этом классе пока нет учеников в базе.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                                        <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                                            <UserCheck className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-700 mb-2">Выберите класс и предмет</h3>
                                        <p className="text-slate-500">Для выставления оценок укажите класс в панели выше.</p>
                                    </div>
                                )}
                            </div>
                        )}
                        {/* ── TAB: ANALYTICS ── */}
                        {activeTab === 'analytics' && (
                            <div className="space-y-8">
                                {analyticsLoading ? (
                                    <div className="flex justify-center py-20">
                                        <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                                    </div>
                                ) : analytics ? (() => {
                                    const riskCfg = {
                                        high:   { label: 'Высокий риск',   bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700',    dot: 'bg-red-500',    bar: 'bg-red-500' },
                                        medium: { label: 'Средний риск',   bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400', bar: 'bg-orange-400' },
                                        low:    { label: 'Низкий риск',    bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400', bar: 'bg-yellow-400' },
                                    };
                                    const highCount   = analytics.risky_students.filter(s => s.risk_level === 'high').length;
                                    const medCount    = analytics.risky_students.filter(s => s.risk_level === 'medium').length;
                                    const lowCount    = analytics.risky_students.filter(s => s.risk_level === 'low').length;

                                    return (
                                        <>
                                            {/* ── KPI Cards ── */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {[
                                                    { icon: <ShieldAlert className="w-6 h-6"/>, label: 'Всего в зоне риска', value: analytics.total_at_risk, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
                                                    { icon: <Activity className="w-6 h-6"/>,    label: 'Высокий риск',       value: highCount,               color: 'text-red-500',    bg: 'bg-red-50 border-red-100' },
                                                    { icon: <TrendingDown className="w-6 h-6"/>,label: 'Средний риск',       value: medCount,                color: 'text-orange-500', bg: 'bg-orange-50 border-orange-100' },
                                                    { icon: <BarChart2 className="w-6 h-6"/>,   label: 'Низкий риск',        value: lowCount,                color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-100' },
                                                ].map((card, i) => (
                                                    <div key={i} className={`rounded-2xl border p-5 flex items-center gap-4 ${card.bg}`}>
                                                        <div className={`${card.color}`}>{card.icon}</div>
                                                        <div>
                                                            <div className="text-3xl font-black text-slate-900">{card.value}</div>
                                                            <div className="text-xs font-bold text-slate-500 mt-0.5">{card.label}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* ── Class Health ── */}
                                            {analytics.class_summary?.length > 0 && (
                                                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                                    <div className="p-6 border-b border-slate-100">
                                                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                            <Users className="w-5 h-5 text-blue-500"/> Успеваемость по классам
                                                        </h2>
                                                    </div>
                                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                        {analytics.class_summary.map((cls, i) => {
                                                            const pct = cls.avg_bolzham;
                                                            const clr = pct >= 85 ? 'bg-green-500' : pct >= 65 ? 'bg-yellow-400' : 'bg-red-500';
                                                            const txtClr = pct >= 85 ? 'text-green-600' : pct >= 65 ? 'text-yellow-600' : 'text-red-600';
                                                            return (
                                                                <div key={i} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                                                    <div className="flex justify-between items-start mb-3">
                                                                        <span className="font-black text-slate-800 text-lg">{cls.class}</span>
                                                                        <span className={`text-2xl font-black ${txtClr}`}>{pct}%</span>
                                                                    </div>
                                                                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
                                                                        <div className={`h-full rounded-full transition-all ${clr}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                                                                    </div>
                                                                    <div className="flex justify-between text-xs text-slate-500 font-medium">
                                                                        <span><Users className="w-3 h-3 inline mr-1"/>{cls.student_count} уч.</span>
                                                                        {cls.at_risk_count > 0 && (
                                                                            <span className="text-red-500 font-bold">⚠ {cls.at_risk_count} в риске</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* ── At-Risk Students ── */}
                                            <div className="space-y-4">
                                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                                    <TrendingDown className="w-5 h-5 text-red-500"/> Ученики в зоне риска <span className="text-slate-400 font-medium">(по вашим предметам)</span>
                                                </h2>
                                                {analytics.risky_students.length === 0 ? (
                                                    <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
                                                        <div className="text-4xl mb-3">🎉</div>
                                                        <p className="text-green-700 font-bold text-lg">Все ученики в норме!</p>
                                                        <p className="text-green-600 text-sm mt-1">Аномальных падений успеваемости не обнаружено.</p>
                                                    </div>
                                                ) : analytics.risky_students.map(student => {
                                                    const cfg = riskCfg[student.risk_level] || riskCfg.low;
                                                    return (
                                                        <div key={student.id} className={`rounded-3xl border p-6 ${cfg.bg} ${cfg.border}`}>
                                                            {/* Student header */}
                                                            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-lg ${cfg.bar}`}>
                                                                        {student.name.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-black text-slate-900 text-base">{student.name}</div>
                                                                        <div className="text-xs text-slate-500 font-medium">{student.class} · {student.issues_count} проблемных предм.</div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="text-right">
                                                                        <div className="text-2xl font-black text-slate-900">{student.overall_bolzham}%</div>
                                                                        <div className="text-xs text-slate-500">Общий болжам</div>
                                                                    </div>
                                                                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black ${cfg.badge}`}>
                                                                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`}></span>
                                                                        {cfg.label}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Subject issues */}
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                {student.issues.map((issue, ii) => {
                                                                    const issueCfg = riskCfg[issue.risk] || riskCfg.low;
                                                                    const maxTrend = Math.max(...(issue.trend.length ? issue.trend : [100]));
                                                                    return (
                                                                        <div key={ii} className="bg-white/70 backdrop-blur rounded-2xl p-4 border border-white/80">
                                                                            <div className="flex justify-between items-start mb-2">
                                                                                <span className="font-bold text-slate-800 text-sm leading-tight max-w-[120px]">{issue.subject}</span>
                                                                                <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${issueCfg.badge}`}>{issue.bolzham}%</span>
                                                                            </div>

                                                                            {/* Mini trend bar chart */}
                                                                            {issue.trend.length > 0 && (
                                                                                <div className="flex items-end gap-1 h-10 mb-3">
                                                                                    {issue.trend.map((v, ti) => (
                                                                                        <div key={ti} className="flex-1 flex flex-col items-center justify-end h-full gap-0.5">
                                                                                            <div
                                                                                                className={`w-full rounded-sm transition-all ${issueCfg.bar} opacity-80`}
                                                                                                style={{ height: `${Math.max(10, (v / (maxTrend || 100)) * 100)}%` }}
                                                                                            ></div>
                                                                                            <span className="text-[9px] text-slate-400 font-bold">Q{ti + 1}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}

                                                                            {/* Last marks + drop */}
                                                                            <div className="flex justify-between items-center">
                                                                                <div className="flex gap-1">
                                                                                    {issue.last_marks.map((m, mi) => (
                                                                                        <span key={mi} className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-black text-white ${m >= 8 ? 'bg-green-500' : m >= 6 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                                                                                            {m}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                                {issue.drop_percent > 0 && (
                                                                                    <span className="flex items-center gap-1 text-xs font-bold text-red-600">
                                                                                        <TrendingDown className="w-3 h-3"/>−{issue.drop_percent}%
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    );
                                })() : (
                                    <div className="text-center py-20 text-slate-400">Не удалось загрузить данные</div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default TeacherDashboard;
