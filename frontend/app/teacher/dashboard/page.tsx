'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    User, Mail, Phone, BookOpen, GraduationCap, Users, Calendar,
    Clock, CheckCircle2, XCircle, Activity, Save, RefreshCw,
    Bell, BellRing, Layers, UserCheck, ClipboardList,
    Hash, ChevronDown, ChevronUp, LogOut,
    Plus, Pencil, Trash2, FileText, FlaskConical, X, MessageCircle,
    Share2, Copy, Check, ExternalLink
} from 'lucide-react';
import { useTeacherAuthStore } from '../../../store/useTeacherAuthStore';
import { bulkSaveAttendance, getAttendanceByGroup } from '../../../lib/services/attendance';

// ─── Types ─────────────────────────────────────────────────────────
interface StudentInGroup {
    id: string;
    name: string;
    surname: string;
    phone?: string;
    email?: string;
    schoolLevel?: string;
    attendances?: { id: string; date: string; status: string }[];
}

interface Group {
    id: string;
    name: string;
    type: string;
    subject?: string;
    level?: string;
    room?: string;
    whatsappUrl?: string;
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
    specialties: string[];
    levels: string[];
    socialMedia?: { whatsapp?: string; linkedin?: string };
    groups: Group[];
    _count: { groups: number };
}

type Tab = 'profil' | 'groupes' | 'presence' | 'cours' | 'notifications';

const DAYS_FR: Record<string, string> = {
    'الأحد': 'Dimanche', 'الاثنين': 'Lundi', 'الثلاثاء': 'Mardi',
    'الأربعاء': 'Mercredi', 'الخميس': 'Jeudi', 'الجمعة': 'Vendredi', 'السبت': 'Samedi',
    'Sunday': 'Dimanche', 'Monday': 'Lundi', 'Tuesday': 'Mardi',
    'Wednesday': 'Mercredi', 'Thursday': 'Jeudi', 'Friday': 'Vendredi', 'Saturday': 'Samedi',
};

// ─── Main Component ─────────────────────────────────────────────────
export default function TeacherDashboardPage() {
    const router = useRouter();
    const { teacher: storeTeacher, teacherToken, loading: storeLoading, getMe, logout } = useTeacherAuthStore();

    const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('profil');

    // Attendance
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, 'present' | 'absent'>>({});
    const [savingAttendance, setSavingAttendance] = useState(false);
    const [attendanceSaved, setAttendanceSaved] = useState(false);

    // Notifications
    const [notifications, setNotifications] = useState<{ id: string; text: string; date: string; read: boolean }[]>([]);

    // Groups expand
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    // Cours & Examens
    type CoursType = 'cours' | 'examen';
    interface CoursItem {
        id: string;
        type: CoursType;
        groupId: string;
        title: string;
        description: string;
        date: string;
        duration: string;
        note: string;
    }
    const [coursList, setCoursList] = useState<CoursItem[]>([]);
    const [coursForm, setCoursForm] = useState<Partial<CoursItem> & { type: CoursType }>({ type: 'cours', groupId: '', title: '', description: '', date: new Date().toISOString().split('T')[0], duration: '', note: '' });
    const [editingCoursId, setEditingCoursId] = useState<string | null>(null);
    const [showCoursForm, setShowCoursForm] = useState(false);
    const [sharingCoursId, setSharingCoursId] = useState<string | null>(null);
    const [copiedCoursId, setCopiedCoursId] = useState<string | null>(null);

    const buildCoursMessage = (item: CoursItem, grp: Group | undefined) => {
        const isExam = item.type === 'examen';
        return (
            `${isExam ? '📝 *Examen*' : '📚 *Cours*'} — *${item.title}*` +
            `\n📅 ${new Date(item.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}` +
            (item.duration ? `\n⏱ Durée : ${item.duration}` : '') +
            (grp ? `\n👥 Groupe : ${grp.name}` : '') +
            (item.description ? `\n\n${item.description}` : '') +
            (item.note ? `\n\n📌 ${item.note}` : '')
        );
    };

    const copyToClipboard = async (text: string, coursId: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedCoursId(coursId);
            setTimeout(() => setCopiedCoursId(null), 2500);
        } catch {
            // fallback for older browsers
            const el = document.createElement('textarea');
            el.value = text;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            setCopiedCoursId(coursId);
            setTimeout(() => setCopiedCoursId(null), 2500);
        }
    };

    // Auth guard + load full profile
    useEffect(() => {
        if (!teacherToken) { router.replace('/login'); return; }
        setLoading(true);
        getMe().finally(() => setLoading(false));
    }, [teacherToken, router, getMe]);

    // Sync enriched store data
    useEffect(() => {
        if (storeTeacher) {
            setTeacher(storeTeacher as unknown as TeacherDetail);
            const stored = localStorage.getItem(`teacher_notifications_${storeTeacher.id}`);
            if (stored) { try { setNotifications(JSON.parse(stored)); } catch {} }
            const storedCours = localStorage.getItem(`teacher_cours_${storeTeacher.id}`);
            if (storedCours) { try { setCoursList(JSON.parse(storedCours)); } catch {} }
        }
    }, [storeTeacher]);

    const saveCoursList = (list: CoursItem[]) => {
        setCoursList(list);
        if (teacher) localStorage.setItem(`teacher_cours_${teacher.id}`, JSON.stringify(list));
    };

    const submitCoursForm = () => {
        if (!coursForm.title || !coursForm.date || !coursForm.groupId) return;
        if (editingCoursId) {
            saveCoursList(coursList.map(c => c.id === editingCoursId ? { ...c, ...coursForm } as CoursItem : c));
            setEditingCoursId(null);
        } else {
            saveCoursList([...coursList, { ...coursForm, id: Date.now().toString() } as CoursItem]);
        }
        setCoursForm({ type: 'cours', groupId: '', title: '', description: '', date: new Date().toISOString().split('T')[0], duration: '', note: '' });
        setShowCoursForm(false);
    };

    const editCours = (item: CoursItem) => {
        setCoursForm({ ...item });
        setEditingCoursId(item.id);
        setShowCoursForm(true);
    };

    const deleteCours = (id: string) => saveCoursList(coursList.filter(c => c.id !== id));

    // Load attendance when group/date changes
    useEffect(() => {
        if (!selectedGroup || !attendanceDate || !teacher) return;
        const grp = teacher.groups?.find(g => g.id === selectedGroup);
        if (!grp) return;
        const map: Record<string, 'present' | 'absent'> = {};
        grp.students.forEach(s => { map[s.id] = 'present'; });
        setAttendanceMap(map);
        getAttendanceByGroup(selectedGroup, attendanceDate).then(res => {
            if (res?.attendances?.length) {
                const fresh = { ...map };
                res.attendances.forEach((a: any) => { fresh[a.studentId] = a.status; });
                setAttendanceMap(fresh);
            }
        }).catch(() => {});
    }, [selectedGroup, attendanceDate, teacher]);

    const saveAttendance = async () => {
        if (!selectedGroup || !attendanceDate || !teacher) return;
        const grp = teacher.groups?.find(g => g.id === selectedGroup);
        if (!grp) return;
        setSavingAttendance(true);
        try {
            await bulkSaveAttendance(grp.students.map(s => ({
                studentId: s.id, date: attendanceDate, status: attendanceMap[s.id] || 'present'
            })));
            setAttendanceSaved(true);
            setTimeout(() => setAttendanceSaved(false), 3000);
        } catch (e) { console.error(e); }
        finally { setSavingAttendance(false); }
    };

    const markRead = (id: string) => {
        const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
        setNotifications(updated);
        if (teacher) localStorage.setItem(`teacher_notifications_${teacher.id}`, JSON.stringify(updated));
    };

    const toggleGroup = (id: string) => {
        setExpandedGroups(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
    };

    if (loading || storeLoading || !teacher) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 font-medium">Chargement du tableau de bord...</p>
                </div>
            </div>
        );
    }

    const groups: Group[] = teacher.groups || [];
    const totalStudents = groups.reduce((acc, g) => acc + (g.students?.length ?? 0), 0);
    const initials = teacher.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
    const unreadCount = notifications.filter(n => !n.read).length;

    const tabs: { id: Tab; label: string; icon: any; count?: number }[] = [
        { id: 'profil', label: 'Profil', icon: User },
        { id: 'groupes', label: 'Groupes & Élèves', icon: Layers, count: groups.length },
        { id: 'presence', label: 'Présence', icon: UserCheck },
        { id: 'cours', label: 'Cours & Examens', icon: ClipboardList },
        { id: 'notifications', label: 'Notifications', icon: Bell, count: unreadCount || undefined },
    ];

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f0f4ff 0%, #e8eeff 50%, #f5f0e8 100%)' }}>
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#1e293b] via-[#2e3b4e] to-[#1e293b] text-white">
                <div className="px-6 py-4 flex items-center justify-between">
                    <span className="text-sm text-amber-300 font-semibold tracking-wide">Espace Formateur</span>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition font-medium"
                    >
                        <LogOut size={15} />
                        <span className="hidden sm:inline">Déconnexion</span>
                    </button>
                </div>

                <div className="px-6 pb-6 flex flex-col lg:flex-row items-start lg:items-center gap-6">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-amber-500/30">
                            {initials}
                        </div>
                        <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#1e293b] ${teacher.status === 'Active' ? 'bg-emerald-400' : 'bg-gray-400'}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                        <h1 className="text-2xl font-black text-white">{teacher.name}</h1>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            {teacher.specialties?.slice(0, 4).map((s: string) => (
                                <span key={s} className="px-2 py-0.5 bg-amber-400/20 text-amber-300 rounded-full text-xs font-semibold border border-amber-400/30">{s}</span>
                            ))}
                            {teacher.levels?.slice(0, 3).map((l: string) => (
                                <span key={l} className="px-2 py-0.5 bg-blue-400/20 text-blue-300 rounded-full text-xs font-semibold border border-blue-400/30">{l}</span>
                            ))}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4">
                        {[
                            { label: 'Groupes', value: groups.length, icon: Layers, color: 'text-purple-300' },
                            { label: 'Élèves', value: totalStudents, icon: Users, color: 'text-blue-300' },
                        ].map(stat => (
                            <div key={stat.label} className="text-center bg-white/5 rounded-xl px-4 py-3 min-w-[80px]">
                                <stat.icon size={16} className={`${stat.color} mx-auto mb-1`} />
                                <p className="text-xl font-black text-white">{stat.value}</p>
                                <p className="text-xs text-slate-400">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                                activeTab === tab.id ? 'border-amber-400 text-amber-300' : 'border-transparent text-slate-400 hover:text-white'
                            }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className="ml-1 bg-amber-400 text-black text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">{tab.count}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-6 max-w-6xl mx-auto">

                {/* Logo Banner */}
                <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex items-center justify-center py-4 px-8">
                    <Image
                        src="/assets/loggo.jpg"
                        alt="Enovazone Logo"
                        width={320}
                        height={100}
                        className="object-contain max-h-24 w-auto"
                        priority
                    />
                </div>

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
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Matières &amp; Niveaux</h3>
                                <div className="mb-3">
                                    <p className="text-xs text-gray-400 mb-2">Matières enseignées</p>
                                    <div className="flex flex-wrap gap-2">
                                        {teacher.specialties?.map((s: string) => (
                                            <span key={s} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">{s}</span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-2">Niveaux</p>
                                    <div className="flex flex-wrap gap-2">
                                        {teacher.levels?.map((l: string) => (
                                            <span key={l} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{l}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {teacher.socialMedia?.whatsapp && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Contact</h3>
                                    <a href={`https://wa.me/${teacher.socialMedia.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-3 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                                        <Phone size={16} className="text-green-600" />
                                        <span className="text-sm font-semibold text-green-700">WhatsApp: {teacher.socialMedia.whatsapp}</span>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── GROUPES ── */}
                {activeTab === 'groupes' && (
                    <div className="space-y-4">
                        {groups.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                                <Layers size={40} className="mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500 font-medium">Aucun groupe assigné</p>
                            </div>
                        ) : groups.map(grp => (
                            <div key={grp.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <button onClick={() => toggleGroup(grp.id)} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
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
                                    <div className="px-5 py-2 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-2 items-center">
                                        {grp.timeSlots.map((slot, i) => (
                                            <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-100">
                                                <Clock size={11} />
                                                {DAYS_FR[slot.day] || slot.day} {slot.startTime}–{slot.endTime}
                                            </span>
                                        ))}
                                        {grp.whatsappUrl && (
                                            <a href={grp.whatsappUrl} target="_blank" rel="noopener noreferrer"
                                                onClick={e => e.stopPropagation()}
                                                className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-full text-xs font-bold transition-colors shadow-sm">
                                                <MessageCircle size={12} /> Groupe WhatsApp
                                            </a>
                                        )}
                                    </div>
                                )}
                                {!grp.timeSlots?.length && grp.whatsappUrl && (
                                    <div className="px-5 py-2 bg-gray-50 border-t border-gray-100 flex">
                                        <a href={grp.whatsappUrl} target="_blank" rel="noopener noreferrer"
                                            onClick={e => e.stopPropagation()}
                                            className="flex items-center gap-1.5 px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-full text-xs font-bold transition-colors shadow-sm">
                                            <MessageCircle size={12} /> Groupe WhatsApp
                                        </a>
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
                                                    const presentCount = s.attendances?.filter(a => a.status === 'present').length || 0;
                                                    const total = s.attendances?.length || 0;
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
                                                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${presentCount >= total * 0.75 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                                                    {presentCount}/{total}
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
                                    <div className="border-t border-gray-100 p-6 text-center text-gray-400 text-sm">Aucun élève dans ce groupe</div>
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
                                        {groups.map(g => (
                                            <option key={g.id} value={g.id}>{g.name} ({g._count.students} élèves)</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Date</label>
                                    <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)}
                                        className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 outline-none text-sm font-medium" />
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
                            const grp = groups.find(g => g.id === selectedGroup);
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
                                            <span className="flex items-center gap-1.5 font-bold text-emerald-600 text-sm"><CheckCircle2 size={16} /> {presentCount}</span>
                                            <span className="flex items-center gap-1.5 font-bold text-red-500 text-sm"><XCircle size={16} /> {absentCount}</span>
                                            <button onClick={() => { const all: Record<string, 'present' | 'absent'> = {}; grp.students.forEach(s => { all[s.id] = 'present'; }); setAttendanceMap(all); }}
                                                className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-colors">
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
                                                            <button onClick={() => setAttendanceMap(p => ({ ...p, [s.id]: 'present' }))}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${status === 'present' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-emerald-50 hover:text-emerald-500'}`}>
                                                                <CheckCircle2 size={14} /> Présent
                                                            </button>
                                                            <button onClick={() => setAttendanceMap(p => ({ ...p, [s.id]: 'absent' }))}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${status === 'absent' ? 'bg-red-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500'}`}>
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
                                            <button onClick={saveAttendance} disabled={savingAttendance}
                                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-60 ${attendanceSaved ? 'bg-emerald-500 text-white' : 'bg-amber-400 hover:bg-amber-500 text-black'}`}>
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

                        {/* Planning hebdomadaire */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5">Planning hebdomadaire</h3>
                            {groups.length === 0 ? (
                                <p className="text-gray-400 text-center py-8">Aucun cours planifié</p>
                            ) : (
                                <div className="space-y-3">
                                    {groups.flatMap(grp => (grp.timeSlots || []).map((slot, i) => ({ ...slot, grp, key: `${grp.id}-${i}` })))
                                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                        .map(item => (
                                            <div key={item.key} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-amber-300/30">
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
                                                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${item.grp.type === 'FORMATION' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {item.grp.type === 'FORMATION' ? 'Formation' : 'Soutien'}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>

                        {/* Récapitulatif des cours */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5">Récapitulatif des cours</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {groups.map(grp => {
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

                        {/* ── Gestion Cours & Examens ── */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Mes Cours &amp; Examens</h3>
                                <button
                                    onClick={() => { setShowCoursForm(true); setEditingCoursId(null); setCoursForm({ type: 'cours', groupId: '', title: '', description: '', date: new Date().toISOString().split('T')[0], duration: '', note: '' }); }}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black text-xs font-bold rounded-xl transition-all"
                                >
                                    <Plus size={14} /> Ajouter
                                </button>
                            </div>

                            {/* Form */}
                            {showCoursForm && (
                                <div className="p-5 border-b border-amber-100 bg-amber-50/40">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="font-bold text-gray-700 text-sm">{editingCoursId ? 'Modifier' : 'Nouveau cours / examen'}</p>
                                        <button onClick={() => setShowCoursForm(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {/* Type */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Type</label>
                                            <div className="flex gap-2">
                                                {(['cours', 'examen'] as const).map(t => (
                                                    <button key={t} onClick={() => setCoursForm(f => ({ ...f, type: t }))}
                                                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${coursForm.type === t ? (t === 'examen' ? 'bg-red-500 text-white border-red-500' : 'bg-blue-500 text-white border-blue-500') : 'bg-white text-gray-400 border-gray-200 hover:border-amber-300'}`}>
                                                        {t === 'cours' ? <span className="flex items-center justify-center gap-1"><FileText size={12} /> Cours</span> : <span className="flex items-center justify-center gap-1"><FlaskConical size={12} /> Examen</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Groupe */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Groupe</label>
                                            <select value={coursForm.groupId} onChange={e => setCoursForm(f => ({ ...f, groupId: e.target.value }))}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-300/30 focus:border-amber-400 outline-none bg-white">
                                                <option value="">— Choisir un groupe —</option>
                                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                            </select>
                                        </div>
                                        {/* Titre */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Titre *</label>
                                            <input value={coursForm.title || ''} onChange={e => setCoursForm(f => ({ ...f, title: e.target.value }))}
                                                placeholder="Ex: Chapitre 3 - Fonctions" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-300/30 focus:border-amber-400 outline-none" />
                                        </div>
                                        {/* Date */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Date *</label>
                                            <input type="date" value={coursForm.date || ''} onChange={e => setCoursForm(f => ({ ...f, date: e.target.value }))}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-300/30 focus:border-amber-400 outline-none" />
                                        </div>
                                        {/* Durée */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Durée</label>
                                            <input value={coursForm.duration || ''} onChange={e => setCoursForm(f => ({ ...f, duration: e.target.value }))}
                                                placeholder="Ex: 2h" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-300/30 focus:border-amber-400 outline-none" />
                                        </div>
                                        {/* Description */}
                                        <div className="sm:col-span-2 xl:col-span-3">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Description / Contenu</label>
                                            <textarea value={coursForm.description || ''} onChange={e => setCoursForm(f => ({ ...f, description: e.target.value }))}
                                                rows={2} placeholder="Décrivez le contenu du cours ou de l'examen..."
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-300/30 focus:border-amber-400 outline-none resize-none" />
                                        </div>
                                        {/* Note */}
                                        <div className="sm:col-span-2 xl:col-span-3">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Note interne</label>
                                            <input value={coursForm.note || ''} onChange={e => setCoursForm(f => ({ ...f, note: e.target.value }))}
                                                placeholder="Notes supplémentaires..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-300/30 focus:border-amber-400 outline-none" />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-end gap-3">
                                        <button onClick={() => setShowCoursForm(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all">Annuler</button>
                                        <button onClick={submitCoursForm} disabled={!coursForm.title || !coursForm.date || !coursForm.groupId}
                                            className="flex items-center gap-2 px-5 py-2 bg-amber-400 hover:bg-amber-500 text-black font-bold text-sm rounded-xl transition-all disabled:opacity-50">
                                            <Save size={14} /> {editingCoursId ? 'Enregistrer les modifications' : 'Ajouter'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* List */}
                            {coursList.length === 0 && !showCoursForm ? (
                                <div className="p-12 text-center">
                                    <ClipboardList size={40} className="mx-auto text-gray-200 mb-3" />
                                    <p className="text-gray-400 font-medium text-sm">Aucun cours ou examen enregistré</p>
                                    <p className="text-xs text-gray-300 mt-1">Cliquez sur « Ajouter » pour commencer</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {[...coursList].sort((a, b) => b.date.localeCompare(a.date)).map(item => {
                                        const grp = groups.find(g => g.id === item.groupId);
                                        const isExam = item.type === 'examen';
                                        return (
                                            <div key={item.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${isExam ? 'bg-red-100' : 'bg-blue-100'}`}>
                                                    {isExam ? <FlaskConical size={18} className="text-red-500" /> : <FileText size={18} className="text-blue-500" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isExam ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                            {isExam ? 'Examen' : 'Cours'}
                                                        </span>
                                                        <p className="font-bold text-gray-800 text-sm">{item.title}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                                                        <span className="flex items-center gap-1"><Calendar size={11} />{new Date(item.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                        {item.duration && <span className="flex items-center gap-1"><Clock size={11} />{item.duration}</span>}
                                                        {grp && <span className="flex items-center gap-1"><Layers size={11} />{grp.name}</span>}
                                                    </div>
                                                    {item.description && <p className="mt-1.5 text-xs text-gray-500 leading-relaxed line-clamp-2">{item.description}</p>}
                                                    {item.note && <p className="mt-1 text-xs text-amber-600 italic">{item.note}</p>}
                                                </div>
                                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                    {/* Action buttons row */}
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => setSharingCoursId(sharingCoursId === item.id ? null : item.id)}
                                                            title={grp?.whatsappUrl ? `Partager dans le groupe WhatsApp : ${grp.name}` : 'Partager sur WhatsApp'}
                                                            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                                                sharingCoursId === item.id
                                                                    ? 'bg-green-500 text-white'
                                                                    : 'bg-green-100 hover:bg-green-500 text-green-700 hover:text-white'
                                                            }`}
                                                        >
                                                            <MessageCircle size={13} />
                                                            <span>{grp?.whatsappUrl ? 'Groupe WA' : 'WA'}</span>
                                                        </button>
                                                        <button onClick={() => editCours(item)} className="w-8 h-8 rounded-lg hover:bg-amber-50 flex items-center justify-center text-gray-400 hover:text-amber-600 transition-colors">
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button onClick={() => deleteCours(item.id)} className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>

                                                    {/* Share Popup */}
                                                    {sharingCoursId === item.id && (() => {
                                                        const msg = buildCoursMessage(item, grp);
                                                        return (
                                                            <div className="w-72 bg-white border border-green-200 rounded-2xl shadow-xl p-4 z-10">
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <span className="text-xs font-bold text-green-700 flex items-center gap-1.5">
                                                                        <MessageCircle size={13} /> Partager sur WhatsApp
                                                                    </span>
                                                                    <button onClick={() => setSharingCoursId(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                                                                </div>

                                                                {/* Message preview */}
                                                                <pre className="text-xs text-gray-600 bg-gray-50 rounded-xl p-3 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto border border-gray-100 mb-3 font-sans">{msg}</pre>

                                                                {/* Action buttons */}
                                                                <div className="flex flex-col gap-2">
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => copyToClipboard(msg, item.id)}
                                                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                                                                        >
                                                                            {copiedCoursId === item.id
                                                                                ? <><Check size={13} className="text-green-600" /> Copié !</>
                                                                                : <><Copy size={13} /> Copier le texte</>
                                                                            }
                                                                        </button>
                                                                        <a
                                                                            href={`https://wa.me/?text=${encodeURIComponent(msg)}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-green-500 hover:bg-green-600 text-white transition-colors"
                                                                        >
                                                                            <Share2 size={13} /> Partager
                                                                        </a>
                                                                    </div>

                                                                    {/* Open WA Group directly if available */}
                                                                    {grp?.whatsappUrl && (
                                                                        <a
                                                                            href={grp.whatsappUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                                                                        >
                                                                            <ExternalLink size={13} /> Ouvrir le groupe : {grp.name}
                                                                        </a>
                                                                    )}
                                                                </div>

                                                                {grp?.whatsappUrl && (
                                                                    <p className="text-[10px] text-gray-400 mt-2 text-center">
                                                                        💡 Copiez le texte, ouvrez le groupe puis collez.
                                                                    </p>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── NOTIFICATIONS ── */}
                {activeTab === 'notifications' && (
                    <div className="space-y-4">
                        {notifications.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                                <BellRing size={40} className="mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500 font-medium">Aucune notification reçue</p>
                                <p className="text-xs text-gray-400 mt-1">Les messages de l'administration apparaîtront ici</p>
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
                                    {!n.read && (
                                        <button onClick={() => markRead(n.id)} className="text-xs font-semibold text-amber-600 hover:underline flex-shrink-0">
                                            Marquer lu
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
