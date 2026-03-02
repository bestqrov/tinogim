'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    User, Mail, Phone, BookOpen, GraduationCap, Users, Calendar,
    Clock, CheckCircle2, XCircle, ChevronRight, ArrowLeft,
    Activity, Save, RefreshCw, Bell, BellRing, Send,
    Layers, UserCheck, ClipboardList, Megaphone,
    DollarSign, TrendingUp, Hash, ChevronDown, ChevronUp
} from 'lucide-react';
import { teachersService } from '@/lib/services/teachers';
import { bulkSaveAttendance, getAttendanceByGroup } from '@/lib/services/attendance';

// ─── Types ────────────────────────────────────────────────────────
interface StudentInGroup {
    id: string;
    name: string;
    surname: string;
    phone?: string;
    email?: string;
    schoolLevel?: string;
    attendance?: { id: string; date: string; status: string }[];
}

interface Group {
    id: string;
    name: string;
    type: string;
    subject?: string;
    level?: string;
    room?: string;
    timeSlots?: { day: string; startTime: string; endTime: string }[];
    students: StudentInGroup[];
    _count: { students: number };
}

interface TeacherDetail {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    cin?: string;
    gender?: string;
    status: string;
    hourlyRate: number;
    paymentType: string;
    commission?: number;
    specialties: string[];
    levels: string[];
    socialMedia?: { whatsapp?: string; linkedin?: string };
    groups: Group[];
    _count: { groups: number };
    createdAt: string;
}

type Tab = 'profil' | 'groupes' | 'presence' | 'cours' | 'notifications';

const DAYS_FR: Record<string, string> = {
    'الأحد': 'Dimanche', 'الاثنين': 'Lundi', 'الثلاثاء': 'Mardi',
    'الأربعاء': 'Mercredi', 'الخميس': 'Jeudi', 'الجمعة': 'Vendredi', 'السبت': 'Samedi',
    'Sunday': 'Dimanche', 'Monday': 'Lundi', 'Tuesday': 'Mardi',
    'Wednesday': 'Mercredi', 'Thursday': 'Jeudi', 'Friday': 'Vendredi', 'Saturday': 'Samedi',
};

// ─── Dashboard inner component (uses useSearchParams) ─────────────
function TeacherDashboardInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const teacherId = searchParams.get('id') || '';

    const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('profil');

    // Attendance state
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, 'present' | 'absent'>>({});
    const [savingAttendance, setSavingAttendance] = useState(false);
    const [attendanceSaved, setAttendanceSaved] = useState(false);

    // Notifications state
    const [notifications, setNotifications] = useState<{ id: string; text: string; date: string; read: boolean }[]>([]);
    const [newNote, setNewNote] = useState('');

    // Groups expand state
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const load = useCallback(async () => {
        if (!teacherId) return;
        setLoading(true);
        try {
            const data = await teachersService.getById(teacherId) as unknown as TeacherDetail;
            setTeacher(data);
            const stored = localStorage.getItem(`teacher_notifications_${teacherId}`);
            if (stored) setNotifications(JSON.parse(stored));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [teacherId]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!selectedGroup || !attendanceDate || !teacher) return;
        const grp = teacher.groups.find(g => g.id === selectedGroup);
        if (!grp) return;
        const map: Record<string, 'present' | 'absent'> = {};
        grp.students.forEach(s => { map[s.id] = 'present'; });
        setAttendanceMap(map);
        getAttendanceByGroup(selectedGroup, attendanceDate).then(res => {
            if (res?.attendances?.length) {
                const fresh: Record<string, 'present' | 'absent'> = { ...map };
                res.attendances.forEach((a: any) => { fresh[a.studentId] = a.status; });
                setAttendanceMap(fresh);
            }
        }).catch(() => {});
    }, [selectedGroup, attendanceDate, teacher]);

    const saveAttendance = async () => {
        if (!selectedGroup || !attendanceDate || !teacher) return;
        const grp = teacher.groups.find(g => g.id === selectedGroup);
        if (!grp) return;
        setSavingAttendance(true);
        try {
            const records = grp.students.map(s => ({
                studentId: s.id,
                date: attendanceDate,
                status: attendanceMap[s.id] || 'present'
            }));
            await bulkSaveAttendance(records);
            setAttendanceSaved(true);
            setTimeout(() => setAttendanceSaved(false), 3000);
        } catch (e) {
            console.error(e);
        } finally {
            setSavingAttendance(false);
        }
    };

    const markRead = (id: string) => {
        const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
        setNotifications(updated);
        localStorage.setItem(`teacher_notifications_${teacherId}`, JSON.stringify(updated));
    };

    const deleteNotification = (id: string) => {
        const updated = notifications.filter(n => n.id !== id);
        setNotifications(updated);
        localStorage.setItem(`teacher_notifications_${teacherId}`, JSON.stringify(updated));
    };

    const sendNotification = () => {
        if (!newNote.trim()) return;
        const note = { id: Date.now().toString(), text: newNote.trim(), date: new Date().toLocaleString('fr-FR'), read: false };
        const updated = [note, ...notifications];
        setNotifications(updated);
        localStorage.setItem(`teacher_notifications_${teacherId}`, JSON.stringify(updated));
        setNewNote('');
    };

    const toggleGroup = (id: string) => {
        setExpandedGroups(prev => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        });
    };

    if (!teacherId) return (
        <div className="flex items-center justify-center h-96">
            <div className="text-center">
                <User size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg font-medium">ID enseignant manquant</p>
                <button onClick={() => router.push('/admin/teachers')} className="mt-4 text-amber-500 hover:underline flex items-center gap-1 mx-auto">
                    <ArrowLeft size={16} /> Retour
                </button>
            </div>
        </div>
    );

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 font-medium">Chargement du tableau de bord...</p>
            </div>
        </div>
    );

    if (!teacher) return (
        <div className="flex items-center justify-center h-96">
            <div className="text-center">
                <User size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg font-medium">Enseignant introuvable</p>
                <button onClick={() => router.push('/admin/teachers')} className="mt-4 text-amber-500 hover:underline flex items-center gap-1 mx-auto">
                    <ArrowLeft size={16} /> Retour
                </button>
            </div>
        </div>
    );

    const totalStudents = teacher.groups.reduce((acc, g) => acc + g._count.students, 0);
    const initials = teacher.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const unreadCount = notifications.filter(n => !n.read).length;

    const tabs: { id: Tab; label: string; icon: any; count?: number }[] = [
        { id: 'profil', label: 'Profil', icon: User },
        { id: 'groupes', label: 'Groupes & Élèves', icon: Layers, count: teacher._count.groups },
        { id: 'presence', label: 'Présence', icon: UserCheck },
        { id: 'cours', label: 'Cours & Examens', icon: ClipboardList },
        { id: 'notifications', label: 'Notifications', icon: Bell, count: unreadCount || undefined },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#1e293b] via-[#2e3b4e] to-[#1e293b] text-white">
                <div className="px-6 py-4 flex items-center gap-3">
                    <button
                        onClick={() => router.push('/admin/teachers')}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <span className="text-sm text-slate-400">Enseignants</span>
                    <ChevronRight size={14} className="text-slate-500" />
                    <span className="text-sm text-amber-300 font-medium">{teacher.name}</span>
                </div>

                <div className="px-6 pb-6 flex flex-col lg:flex-row items-start lg:items-center gap-6">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-amber-500/30">
                            {initials}
                        </div>
                        <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#1e293b] ${teacher.status === 'Active' ? 'bg-emerald-400' : 'bg-gray-400'}`} />
                    </div>

                    <div className="flex-1">
                        <h1 className="text-2xl font-black text-white">{teacher.name}</h1>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            {teacher.specialties.slice(0, 4).map(s => (
                                <span key={s} className="px-2 py-0.5 bg-amber-400/20 text-amber-300 rounded-full text-xs font-semibold border border-amber-400/30">{s}</span>
                            ))}
                            {teacher.levels.slice(0, 3).map(l => (
                                <span key={l} className="px-2 py-0.5 bg-blue-400/20 text-blue-300 rounded-full text-xs font-semibold border border-blue-400/30">{l}</span>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        {[
                            { label: 'Groupes', value: teacher._count.groups, icon: Layers, color: 'text-purple-300' },
                            { label: 'Élèves', value: totalStudents, icon: Users, color: 'text-blue-300' },
                            { label: 'MAD/h', value: teacher.hourlyRate, icon: DollarSign, color: 'text-emerald-300' },
                        ].map(stat => (
                            <div key={stat.label} className="text-center bg-white/5 rounded-xl px-4 py-3 min-w-[80px]">
                                <stat.icon size={16} className={`${stat.color} mx-auto mb-1`} />
                                <p className="text-xl font-black text-white">{stat.value}</p>
                                <p className="text-xs text-slate-400">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex overflow-x-auto scrollbar-hide">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                                activeTab === tab.id
                                    ? 'border-amber-400 text-amber-300'
                                    : 'border-transparent text-slate-400 hover:text-white'
                            }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className="ml-1 bg-amber-400 text-black text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-6 max-w-6xl mx-auto">

                {/* ── PROFIL ── */}
                {activeTab === 'profil' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5">Informations personnelles</h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Nom complet', value: teacher.name, icon: User },
                                    { label: 'Email', value: teacher.email || '—', icon: Mail },
                                    { label: 'Téléphone', value: teacher.phone || '—', icon: Phone },
                                    { label: 'CIN', value: teacher.cin || '—', icon: Hash },
                                    { label: 'Genre', value: teacher.gender || '—', icon: User },
                                    { label: 'Statut', value: teacher.status === 'Active' ? 'Actif' : 'Inactif', icon: Activity },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                                            <item.icon size={16} className="text-amber-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">{item.label}</p>
                                            <p className="text-sm font-semibold text-gray-800">{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5">Informations professionnelles</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                                        <div>
                                            <p className="text-xs text-gray-500">Type de paiement</p>
                                            <p className="font-bold text-gray-800">
                                                {teacher.paymentType === 'HOURLY' ? 'Par heure' : teacher.paymentType === 'FIXED' ? 'Salaire fixe' : 'Commission (%)'}
                                            </p>
                                        </div>
                                        <DollarSign className="text-amber-500" size={22} />
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                                        <div>
                                            <p className="text-xs text-gray-500">
                                                {teacher.paymentType === 'HOURLY' ? 'Taux horaire' : teacher.paymentType === 'PERCENTAGE' ? 'Commission' : 'Salaire mensuel'}
                                            </p>
                                            <p className="font-bold text-gray-800">
                                                {teacher.paymentType === 'PERCENTAGE'
                                                    ? `${teacher.commission || 0}%`
                                                    : `${teacher.hourlyRate} MAD`}
                                            </p>
                                        </div>
                                        <TrendingUp className="text-emerald-500" size={22} />
                                    </div>
                                    {teacher.socialMedia?.whatsapp && (
                                        <a href={`https://wa.me/${teacher.socialMedia.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                                            className="flex items-center gap-3 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                                            <Phone size={16} className="text-green-600" />
                                            <span className="text-sm font-semibold text-green-700">WhatsApp: {teacher.socialMedia.whatsapp}</span>
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Matières &amp; Niveaux</h3>
                                <div className="mb-3">
                                    <p className="text-xs text-gray-400 mb-2">Matières enseignées</p>
                                    <div className="flex flex-wrap gap-2">
                                        {teacher.specialties.map(s => (
                                            <span key={s} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">{s}</span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-2">Niveaux</p>
                                    <div className="flex flex-wrap gap-2">
                                        {teacher.levels.map(l => (
                                            <span key={l} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{l}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── GROUPES ── */}
                {activeTab === 'groupes' && (
                    <div className="space-y-4">
                        {teacher.groups.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                                <Layers size={40} className="mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500 font-medium">Aucun groupe assigné</p>
                            </div>
                        ) : teacher.groups.map(grp => (
                            <div key={grp.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <button
                                    onClick={() => toggleGroup(grp.id)}
                                    className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg ${grp.type === 'FORMATION' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-blue-500 to-cyan-600'}`}>
                                            {grp.type === 'FORMATION' ? 'F' : 'S'}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-gray-800">{grp.name}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                {grp.subject && <span className="text-xs text-gray-500 flex items-center gap-1"><BookOpen size={11} /> {grp.subject}</span>}
                                                {grp.level && <span className="text-xs text-gray-500 flex items-center gap-1"><GraduationCap size={11} /> {grp.level}</span>}
                                                {grp.room && <span className="text-xs text-gray-500 flex items-center gap-1"><Hash size={11} /> {grp.room}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-gray-800">{grp._count.students}</p>
                                            <p className="text-xs text-gray-400">élève{grp._count.students !== 1 ? 's' : ''}</p>
                                        </div>
                                        {expandedGroups.has(grp.id) ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                    </div>
                                </button>

                                {grp.timeSlots && grp.timeSlots.length > 0 && (
                                    <div className="px-5 py-2 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-2">
                                        {grp.timeSlots.map((slot, i) => (
                                            <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-100">
                                                <Clock size={11} />
                                                {DAYS_FR[slot.day] || slot.day} {slot.startTime}–{slot.endTime}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {expandedGroups.has(grp.id) && grp.students.length > 0 && (
                                    <div className="border-t border-gray-100">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                    <th className="px-5 py-3 text-left">#</th>
                                                    <th className="px-5 py-3 text-left">Nom complet</th>
                                                    <th className="px-5 py-3 text-left">Niveau</th>
                                                    <th className="px-5 py-3 text-left">Téléphone</th>
                                                    <th className="px-5 py-3 text-center">Présences</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {grp.students.map((s, idx) => {
                                                    const presentCount = s.attendance?.filter(a => a.status === 'present').length || 0;
                                                    const totalSessions = s.attendance?.length || 0;
                                                    return (
                                                        <tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                                                            <td className="px-5 py-3 text-gray-400 font-mono text-xs">{idx + 1}</td>
                                                            <td className="px-5 py-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 text-xs font-bold">
                                                                        {s.name[0]}{s.surname[0]}
                                                                    </div>
                                                                    <span className="font-semibold text-gray-800">{s.name} {s.surname}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3 text-gray-600 text-xs">{s.schoolLevel || '—'}</td>
                                                            <td className="px-5 py-3 text-gray-600">{s.phone || '—'}</td>
                                                            <td className="px-5 py-3 text-center">
                                                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${presentCount >= totalSessions * 0.75 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                                                    {presentCount}/{totalSessions}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {expandedGroups.has(grp.id) && grp.students.length === 0 && (
                                    <div className="border-t border-gray-100 p-6 text-center text-gray-400 text-sm">
                                        Aucun élève dans ce groupe
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* ── PRÉSENCE ── */}
                {activeTab === 'presence' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Saisir une feuille de présence</h3>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Groupe</label>
                                    <select
                                        value={selectedGroup}
                                        onChange={e => { setSelectedGroup(e.target.value); setAttendanceSaved(false); }}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 outline-none bg-white text-sm font-medium"
                                    >
                                        <option value="">— Choisir un groupe —</option>
                                        {teacher.groups.map(g => (
                                            <option key={g.id} value={g.id}>{g.name} ({g._count.students} élèves)</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Date</label>
                                    <input
                                        type="date"
                                        value={attendanceDate}
                                        onChange={e => setAttendanceDate(e.target.value)}
                                        className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 outline-none text-sm font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        {!selectedGroup && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                                <UserCheck size={40} className="mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500 font-medium">Sélectionnez un groupe pour saisir la présence</p>
                            </div>
                        )}

                        {selectedGroup && (() => {
                            const grp = teacher.groups.find(g => g.id === selectedGroup);
                            if (!grp) return null;
                            const presentCount = Object.values(attendanceMap).filter(v => v === 'present').length;
                            const absentCount = grp.students.length - presentCount;
                            return (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-gray-800">{grp.name}</h4>
                                            <p className="text-sm text-gray-500 mt-0.5">
                                                {new Date(attendanceDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex gap-3 text-sm">
                                                <span className="flex items-center gap-1.5 font-bold text-emerald-600"><CheckCircle2 size={16} /> {presentCount}</span>
                                                <span className="flex items-center gap-1.5 font-bold text-red-500"><XCircle size={16} /> {absentCount}</span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const all: Record<string, 'present' | 'absent'> = {};
                                                    grp.students.forEach(s => { all[s.id] = 'present'; });
                                                    setAttendanceMap(all);
                                                }}
                                                className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-colors"
                                            >
                                                Tous présents
                                            </button>
                                        </div>
                                    </div>

                                    {grp.students.length === 0 ? (
                                        <div className="p-10 text-center text-gray-400">Aucun élève dans ce groupe</div>
                                    ) : (
                                        <div className="divide-y divide-gray-50">
                                            {grp.students.map((s, idx) => {
                                                const status = attendanceMap[s.id] || 'present';
                                                return (
                                                    <div key={s.id} className={`flex items-center justify-between px-5 py-3.5 transition-colors ${status === 'present' ? 'bg-white hover:bg-emerald-50/30' : 'bg-red-50/40 hover:bg-red-50'}`}>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-xs text-gray-300 font-mono w-5 text-center">{idx + 1}</span>
                                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black ${status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-500'}`}>
                                                                {s.name[0]}{s.surname[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-800">{s.name} {s.surname}</p>
                                                                {s.phone && <p className="text-xs text-gray-400">{s.phone}</p>}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => setAttendanceMap(prev => ({ ...prev, [s.id]: 'present' }))}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${status === 'present' ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' : 'bg-gray-100 text-gray-400 hover:bg-emerald-50 hover:text-emerald-500'}`}
                                                            >
                                                                <CheckCircle2 size={14} /> Présent
                                                            </button>
                                                            <button
                                                                onClick={() => setAttendanceMap(prev => ({ ...prev, [s.id]: 'absent' }))}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${status === 'absent' ? 'bg-red-500 text-white shadow-sm shadow-red-500/30' : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500'}`}
                                                            >
                                                                <XCircle size={14} /> Absent
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {grp.students.length > 0 && (
                                        <div className="p-5 border-t border-gray-100 flex justify-end">
                                            <button
                                                onClick={saveAttendance}
                                                disabled={savingAttendance}
                                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${attendanceSaved ? 'bg-emerald-500 text-white' : 'bg-amber-400 hover:bg-amber-500 text-black'} disabled:opacity-60`}
                                            >
                                                {savingAttendance ? <RefreshCw size={16} className="animate-spin" /> : attendanceSaved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                                                {savingAttendance ? 'Enregistrement...' : attendanceSaved ? 'Enregistré !' : 'Enregistrer la présence'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* ── COURS & EXAMENS ── */}
                {activeTab === 'cours' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5">Planning hebdomadaire</h3>
                            {teacher.groups.length === 0 ? (
                                <p className="text-gray-400 text-center py-8">Aucun cours planifié</p>
                            ) : (
                                <div className="space-y-3">
                                    {teacher.groups.flatMap(grp =>
                                        (grp.timeSlots || []).map((slot, i) => ({ ...slot, grp, key: `${grp.id}-${i}` }))
                                    ).sort((a, b) => a.startTime.localeCompare(b.startTime)).map(item => (
                                        <div key={item.key} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center flex-shrink-0">
                                                <Calendar size={20} className="text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-800">{item.grp.name}</p>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                                    {item.grp.subject && <span className="flex items-center gap-1"><BookOpen size={12} />{item.grp.subject}</span>}
                                                    {item.grp.room && <span className="flex items-center gap-1"><Hash size={12} />{item.grp.room}</span>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-amber-600">{DAYS_FR[item.day] || item.day}</p>
                                                <p className="text-sm text-gray-500">{item.startTime} — {item.endTime}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.grp.type === 'FORMATION' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {item.grp.type === 'FORMATION' ? 'Formation' : 'Soutien'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5">Récapitulatif des cours</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {teacher.groups.map(grp => {
                                    const hoursPerWeek = (grp.timeSlots || []).reduce((acc, slot) => {
                                        const [sh, sm] = slot.startTime.split(':').map(Number);
                                        const [eh, em] = slot.endTime.split(':').map(Number);
                                        return acc + (eh * 60 + em - sh * 60 - sm) / 60;
                                    }, 0);
                                    return (
                                        <div key={grp.id} className={`p-4 rounded-xl border-2 ${grp.type === 'FORMATION' ? 'border-purple-100 bg-purple-50' : 'border-blue-100 bg-blue-50'}`}>
                                            <p className="font-bold text-gray-800 text-sm mb-2">{grp.name}</p>
                                            <div className="space-y-1.5 text-xs text-gray-600">
                                                <div className="flex justify-between"><span>Élèves</span><span className="font-bold text-gray-800">{grp._count.students}</span></div>
                                                <div className="flex justify-between"><span>Séances/sem.</span><span className="font-bold text-gray-800">{grp.timeSlots?.length || 0}</span></div>
                                                <div className="flex justify-between"><span>Heures/sem.</span><span className="font-bold text-amber-600">{hoursPerWeek.toFixed(1)}h</span></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── NOTIFICATIONS ── */}
                {activeTab === 'notifications' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                                <Megaphone size={14} className="inline mr-2 text-amber-500" />
                                Envoyer un message à cet enseignant
                            </h3>
                            <div className="flex gap-3">
                                <textarea
                                    value={newNote}
                                    onChange={e => setNewNote(e.target.value)}
                                    placeholder="Écrire une notification ou un message..."
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendNotification(); }}}
                                    rows={3}
                                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 outline-none resize-none text-sm"
                                />
                                <button
                                    onClick={sendNotification}
                                    disabled={!newNote.trim()}
                                    className="px-5 py-3 bg-amber-400 hover:bg-amber-500 text-black font-bold rounded-xl transition-all disabled:opacity-40 flex items-center gap-2 self-end"
                                >
                                    <Send size={16} /> Envoyer
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {notifications.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                                    <BellRing size={40} className="mx-auto text-gray-300 mb-3" />
                                    <p className="text-gray-500 font-medium">Aucune notification envoyée</p>
                                </div>
                            ) : notifications.map(n => (
                                <div key={n.id} className={`bg-white rounded-2xl border p-5 transition-all ${n.read ? 'border-gray-100 opacity-70' : 'border-amber-200 shadow-sm shadow-amber-100'}`}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${n.read ? 'bg-gray-100' : 'bg-amber-100'}`}>
                                                <Bell size={16} className={n.read ? 'text-gray-400' : 'text-amber-500'} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-800 font-medium">{n.text}</p>
                                                <p className="text-xs text-gray-400 mt-1">{n.date}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {!n.read && (
                                                <button onClick={() => markRead(n.id)} className="text-xs font-semibold text-amber-600 hover:underline">
                                                    Marquer lu
                                                </button>
                                            )}
                                            <button onClick={() => deleteNotification(n.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                                                Supprimer
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

// ─── Page export (wrapped in Suspense for useSearchParams) ─────────
export default function TeacherDashboardPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-96">
                <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <TeacherDashboardInner />
        </Suspense>
    );
}
