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

type CoursType = 'cours' | 'examen';
interface CoursItem {
    id: string; type: CoursType; groupId: string; title: string;
    objectif: string; plan: string; description: string; date: string; duration: string; note: string;
}

const DAYS_FR: Record<string, string> = {
    'الأحد': 'Dimanche', 'الاثنين': 'Lundi', 'الثلاثاء': 'Mardi',
    'الأربعاء': 'Mercredi', 'الخميس': 'Jeudi', 'الجمعة': 'Vendredi', 'السبت': 'Samedi',
    'Sunday': 'Dimanche', 'Monday': 'Lundi', 'Tuesday': 'Mardi',
    'Wednesday': 'Mercredi', 'Thursday': 'Jeudi', 'Friday': 'Vendredi', 'Saturday': 'Samedi',
};

// ─── Mock Data (set to false to use real API) ───────────────────────
const MOCK_MODE = false;

const MOCK_TEACHER: TeacherDetail = {
    id: 'mock-teacher-1',
    name: 'أستاذ يوسف بنعلي',
    email: 'youssef@enovaacademy.ma',
    phone: '0661234567',
    cin: 'BE123456',
    gender: 'male',
    status: 'active',
    specialties: ['Mathématiques', 'Physique'],
    levels: ['Terminale', '1ère Bac'],
    socialMedia: { whatsapp: '212661234567' },
    _count: { groups: 2 },
    groups: [
        {
            id: 'grp-1',
            name: 'Groupe Maths Terminale A',
            type: 'regular',
            subject: 'Mathématiques',
            level: 'Terminale',
            room: 'Salle 3',
            whatsappUrl: 'https://chat.whatsapp.com/example1',
            timeSlots: [
                { day: 'Lundi', startTime: '14:00', endTime: '16:00' },
                { day: 'Jeudi', startTime: '16:00', endTime: '18:00' },
            ],
            _count: { students: 4 },
            students: [
                { id: 's1', name: 'Karim', surname: 'Alaoui', phone: '0600000001', schoolLevel: 'Terminale' },
                { id: 's2', name: 'Salma', surname: 'Benali', phone: '0600000002', schoolLevel: 'Terminale' },
                { id: 's3', name: 'Yassine', surname: 'Hajji', phone: '0600000003', schoolLevel: 'Terminale' },
                { id: 's4', name: 'Nour', surname: 'Rachidi', phone: '0600000004', schoolLevel: 'Terminale' },
            ],
        },
        {
            id: 'grp-2',
            name: 'Groupe Physique 1ère Bac',
            type: 'regular',
            subject: 'Physique-Chimie',
            level: '1ère Bac',
            room: 'Salle 1',
            whatsappUrl: 'https://chat.whatsapp.com/example2',
            timeSlots: [
                { day: 'Mardi', startTime: '10:00', endTime: '12:00' },
            ],
            _count: { students: 3 },
            students: [
                { id: 's5', name: 'Amine', surname: 'Tazi', phone: '0600000005', schoolLevel: '1ère Bac' },
                { id: 's6', name: 'Hajar', surname: 'Moussaoui', phone: '0600000006', schoolLevel: '1ère Bac' },
                { id: 's7', name: 'Omar', surname: 'Filali', phone: '0600000007', schoolLevel: '1ère Bac' },
            ],
        },
    ],
};

const MOCK_COURS: CoursItem[] = [
    {
        id: 'c1',
        type: 'cours',
        groupId: 'grp-1',
        title: 'الفصل 3 - الدوال الخطية',
        objectif: 'فهم الدوال الخطية ورسم تمثيلها البياني',
        plan: '1. مراجعة الدرس السابق (10 دقائق)\n2. شرح مفهوم الدالة الخطية (20 دقيقة)\n3. تمارين تطبيقية (25 دقيقة)\n4. تصحيح وتلخيص (5 دقائق)',
        description: 'تعريف الدالة الخطية f(x)=ax، دراسة الإشارة، تمثيل بياني.',
        date: '2026-03-10',
        duration: 'ساعتان',
        note: 'إحضار الآلة الحاسبة',
    },
    {
        id: 'c2',
        type: 'examen',
        groupId: 'grp-1',
        title: 'فرض محروس رقم 1',
        objectif: 'تقييم الفصلين 1 و 2',
        plan: '',
        description: 'الفصل 1: المتتاليات — الفصل 2: الحساب المثلثي',
        date: '2026-03-17',
        duration: '2 ساعة',
        note: '',
    },
    {
        id: 'c3',
        type: 'cours',
        groupId: 'grp-2',
        title: 'الكهرباء - قانون أوم',
        objectif: 'تطبيق قانون أوم في الدوائر الكهربائية البسيطة',
        plan: '1. تذكير بالمفاهيم الأساسية (15 دقيقة)\n2. شرح قانون أوم (20 دقيقة)\n3. تمارين (20 دقيقة)',
        description: 'U = RI، تطبيقات عملية، قياسات.',
        date: '2026-03-11',
        duration: 'ساعتان',
        note: '',
    },
];

const MOCK_NOTIFICATIONS = [
    { id: 'n1', text: '📢 اجتماع الأساتذة يوم الجمعة 13 مارس الساعة 10:00 في قاعة الاجتماعات.', date: '05/03/2026', read: false },
    { id: 'n2', text: '✅ تم تسجيل نتائج الفرض المحروس بنجاح. شكراً لك!', date: '04/03/2026', read: true },
];

// ─── Main Component ─────────────────────────────────────────────────
export default function TeacherDashboardPage() {
    const router = useRouter();
    const { teacher: storeTeacher, teacherToken, loading: storeLoading, getMe, logout } = useTeacherAuthStore();

    // Hoist CoursItem type for mock data usage above — type is now at module level

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
    const [coursList, setCoursList] = useState<CoursItem[]>([]);
    const [coursForm, setCoursForm] = useState<Partial<CoursItem> & { type: CoursType }>({ type: 'cours', groupId: '', title: '', objectif: '', plan: '', description: '', date: new Date().toISOString().split('T')[0], duration: '', note: '' });
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
            (item.objectif ? `\n\n🎯 *Objectif :*\n${item.objectif}` : '') +
            (item.plan ? `\n\n📋 *Plan de la séance :*\n${item.plan}` : '') +
            (item.description ? `\n\n📝 *Contenu :*\n${item.description}` : '') +
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
        if (MOCK_MODE) {
            setTeacher(MOCK_TEACHER);
            setCoursList(MOCK_COURS as CoursItem[]);
            setNotifications(MOCK_NOTIFICATIONS);
            setLoading(false);
            return;
        }
        if (!teacherToken) { router.replace('/login'); return; }
        setLoading(true);
        getMe().finally(() => setLoading(false));
    }, [teacherToken, router, getMe]);

    // Sync enriched store data
    useEffect(() => {
        if (MOCK_MODE) return; // mock data already set above
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
        setCoursForm({ type: 'cours', groupId: '', title: '', objectif: '', plan: '', description: '', date: new Date().toISOString().split('T')[0], duration: '', note: '' });
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

    if (loading || (!MOCK_MODE && storeLoading) || !teacher) {
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
                                        <p className="font-bold text-gray-700 text-sm" dir="rtl">{editingCoursId ? 'تعديل الدرس' : 'إضافة درس / امتحان'}</p>
                                        <button onClick={() => setShowCoursForm(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {/* Type */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 block mb-1.5" dir="rtl">النوع</label>
                                            <div className="flex gap-2">
                                                {(['cours', 'examen'] as const).map(t => (
                                                    <button key={t} onClick={() => setCoursForm(f => ({ ...f, type: t }))}
                                                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${coursForm.type === t ? (t === 'examen' ? 'bg-red-500 text-white border-red-500' : 'bg-blue-500 text-white border-blue-500') : 'bg-white text-gray-400 border-gray-200 hover:border-amber-300'}`}>
                                                        {t === 'cours' ? <span className="flex items-center justify-center gap-1"><FileText size={12} /> درس</span> : <span className="flex items-center justify-center gap-1"><FlaskConical size={12} /> امتحان</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Groupe */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 block mb-1.5" dir="rtl">المجموعة</label>
                                            <select value={coursForm.groupId} onChange={e => setCoursForm(f => ({ ...f, groupId: e.target.value }))}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-300/30 focus:border-amber-400 outline-none bg-white" dir="rtl">
                                                <option value="">— اختر المجموعة —</option>
                                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                            </select>
                                        </div>
                                        {/* Titre */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 block mb-1.5" dir="rtl">عنوان الدرس *</label>
                                            <input value={coursForm.title || ''} onChange={e => setCoursForm(f => ({ ...f, title: e.target.value }))}
                                                placeholder="مثال: الفصل 3 - الدوال" dir="rtl" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-300/30 focus:border-amber-400 outline-none" />
                                        </div>
                                        {/* Date */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 block mb-1.5" dir="rtl">تاريخ الحصة *</label>
                                            <input type="date" value={coursForm.date || ''} onChange={e => setCoursForm(f => ({ ...f, date: e.target.value }))}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-300/30 focus:border-amber-400 outline-none" />
                                        </div>
                                        {/* Durée */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 block mb-1.5" dir="rtl">المدة</label>
                                            <input value={coursForm.duration || ''} onChange={e => setCoursForm(f => ({ ...f, duration: e.target.value }))}
                                                placeholder="مثال: ساعتان" dir="rtl" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-300/30 focus:border-amber-400 outline-none" />
                                        </div>
                                        {/* Objectif */}
                                        <div className="sm:col-span-2 xl:col-span-3">
                                            <label className="text-xs font-bold text-gray-500 block mb-1.5" dir="rtl">🎯 هدف الحصة *</label>
                                            <input value={coursForm.objectif || ''} onChange={e => setCoursForm(f => ({ ...f, objectif: e.target.value }))}
                                                placeholder="مثال: فهم الدوال الخطية وتمثيلها البياني" dir="rtl"
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-300/30 focus:border-amber-400 outline-none" />
                                        </div>
                                        {/* Plan */}
                                        <div className="sm:col-span-2 xl:col-span-3">
                                            <label className="text-xs font-bold text-gray-500 block mb-1.5" dir="rtl">📋 خطة الحصة</label>
                                            <textarea value={coursForm.plan || ''} onChange={e => setCoursForm(f => ({ ...f, plan: e.target.value }))}
                                                rows={3} dir="rtl" placeholder={`مثال:\n1. مراجعة الدرس السابق (10 دقائق)\n2. شرح المفاهيم الجديدة (20 دقيقة)\n3. تمارين تطبيقية (25 دقيقة)\n4. تصحيح وتلخيص (5 دقائق)`}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-300/30 focus:border-amber-400 outline-none resize-none" />
                                        </div>
                                        {/* Description */}
                                        <div className="sm:col-span-2 xl:col-span-3">
                                            <label className="text-xs font-bold text-gray-500 block mb-1.5" dir="rtl">📝 محتوى الحصة</label>
                                            <textarea value={coursForm.description || ''} onChange={e => setCoursForm(f => ({ ...f, description: e.target.value }))}
                                                rows={2} dir="rtl" placeholder="صف محتوى الدرس أو الامتحان..."
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-300/30 focus:border-amber-400 outline-none resize-none" />
                                        </div>
                                        {/* Note */}
                                        <div className="sm:col-span-2 xl:col-span-3">
                                            <label className="text-xs font-bold text-gray-500 block mb-1.5" dir="rtl">ملاحظة داخلية</label>
                                            <input value={coursForm.note || ''} onChange={e => setCoursForm(f => ({ ...f, note: e.target.value }))}
                                                placeholder="ملاحظات إضافية..." dir="rtl" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-300/30 focus:border-amber-400 outline-none" />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-end gap-3">
                                        <button onClick={() => setShowCoursForm(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all">إلغاء</button>
                                        <button onClick={submitCoursForm} disabled={!coursForm.title || !coursForm.date || !coursForm.groupId || !coursForm.objectif}
                                            className="flex items-center gap-2 px-5 py-2 bg-amber-400 hover:bg-amber-500 text-black font-bold text-sm rounded-xl transition-all disabled:opacity-50">
                                            <Save size={14} /> {editingCoursId ? 'حفظ التعديلات' : 'إضافة'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* List */}
                            {coursList.length === 0 && !showCoursForm ? (
                                <div className="p-12 text-center">
                                    <ClipboardList size={40} className="mx-auto text-gray-200 mb-3" />
                                    <p className="text-gray-400 font-medium text-sm" dir="rtl">لا توجد دروس أو امتحانات مسجلة</p>
                                    <p className="text-xs text-gray-300 mt-1" dir="rtl">انقر على « إضافة » للبدء</p>
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
                                                            {isExam ? 'امتحان' : 'درس'}
                                                        </span>
                                                        <p className="font-bold text-gray-800 text-sm">{item.title}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                                                        <span className="flex items-center gap-1"><Calendar size={11} />{new Date(item.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                        {item.duration && <span className="flex items-center gap-1"><Clock size={11} />{item.duration}</span>}
                                                        {grp && <span className="flex items-center gap-1"><Layers size={11} />{grp.name}</span>}
                                                    </div>
                                                    {item.objectif && (
                                                        <div className="mt-1.5 flex items-start gap-1">
                                                            <span className="text-xs text-purple-500 font-bold shrink-0">🎯</span>
                                                            <p className="text-xs text-purple-700 leading-relaxed line-clamp-1">{item.objectif}</p>
                                                        </div>
                                                    )}
                                                    {item.plan && (
                                                        <div className="mt-1 flex items-start gap-1">
                                                            <span className="text-xs text-blue-500 font-bold shrink-0">📋</span>
                                                            <p className="text-xs text-blue-600 leading-relaxed line-clamp-2 whitespace-pre-line">{item.plan}</p>
                                                        </div>
                                                    )}
                                                    {item.description && <p className="mt-1 text-xs text-gray-500 leading-relaxed line-clamp-1">{item.description}</p>}
                                                    {item.note && <p className="mt-1 text-xs text-amber-600 italic">{item.note}</p>}
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                        {/* WhatsApp share icon button */}
                                                        <button
                                                            onClick={() => setSharingCoursId(sharingCoursId === item.id ? null : item.id)}
                                                            title="مشاركة على واتساب"
                                                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                                                                sharingCoursId === item.id
                                                                    ? 'bg-green-500 text-white scale-110 shadow-green-200'
                                                                    : 'bg-green-100 text-green-600 hover:bg-green-500 hover:text-white hover:scale-105'
                                                            }`}
                                                        >
                                                            <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                                                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.535 5.845L.057 23.571a.75.75 0 0 0 .92.92l5.763-1.484A11.946 11.946 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.686-.524-5.21-1.434l-.374-.223-3.875.997.985-3.758-.245-.387A9.953 9.953 0 0 1 2 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/>
                                                            </svg>
                                                        </button>
                                                        <button onClick={() => editCours(item)} className="w-8 h-8 rounded-lg hover:bg-amber-50 flex items-center justify-center text-gray-400 hover:text-amber-600 transition-colors">
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button onClick={() => deleteCours(item.id)} className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                                                            <Trash2 size={14} />
                                                        </button>
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
                                <p className="text-gray-500 font-medium" dir="rtl">لا توجد إشعارات</p>
                                <p className="text-xs text-gray-400 mt-1" dir="rtl">ستظهر رسائل الإدارة هنا</p>
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
                                            تمييز كمقروء
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── WhatsApp Share Modal (fixed overlay) ── */}
            {sharingCoursId && (() => {
                const item = coursList.find(c => c.id === sharingCoursId);
                if (!item) return null;
                const grp = groups.find(g => g.id === item.groupId);
                const isExam = item.type === 'examen';
                const msg = buildCoursMessage(item, grp);
                return (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
                            onClick={() => setSharingCoursId(null)}
                        />
                        {/* Modal */}
                        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
                            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.535 5.845L.057 23.571a.75.75 0 0 0 .92.92l5.763-1.484A11.946 11.946 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.686-.524-5.21-1.434l-.374-.223-3.875.997.985-3.758-.245-.387A9.953 9.953 0 0 1 2 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm">مشاركة على واتساب</p>
                                                    <p className="text-white/70 text-xs">{isExam ? '📝 امتحان' : '📚 درس'} — {item.title}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSharingCoursId(null)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="p-5 space-y-4">
                                    {/* Message preview */}
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 mb-2" dir="rtl">معاينة الرسالة</p>
                                        <pre className="text-sm text-gray-700 bg-gray-50 rounded-2xl px-4 py-3 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto border border-gray-100 font-sans">{msg}</pre>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => copyToClipboard(msg, item.id)}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold border-2 border-gray-200 hover:border-gray-300 bg-white text-gray-700 transition-all"
                                        >
                                            {copiedCoursId === item.id
                                                ? <><Check size={16} className="text-green-500" /> تم النسخ !</>
                                                : <><Copy size={16} /> نسخ</>
                                            }
                                        </button>
                                        <a
                                            href={`https://wa.me/?text=${encodeURIComponent(msg)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold bg-green-500 hover:bg-green-600 text-white transition-all shadow-md shadow-green-200"
                                        >
                                            <Share2 size={16} /> مشاركة
                                        </a>
                                    </div>

                                    {/* Open group link */}
                                    {grp?.whatsappUrl && (
                                        <a
                                            href={grp.whatsappUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-2 border-emerald-200 transition-all"
                                        >
                                            <ExternalLink size={16} />
                                            فتح المجموعة : <span className="font-black">{grp.name}</span>
                                        </a>
                                    )}

                                    {grp?.whatsappUrl && (
                                        <p className="text-center text-xs text-gray-400">
                                            💡 انسخ الرسالة ← افتح المجموعة ← الصق وأرسل
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                );
            })()}
        </div>
    );
}
