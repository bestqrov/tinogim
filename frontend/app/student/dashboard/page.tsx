'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    User, BookOpen, Calendar, CreditCard, Bell, LogOut,
    CheckCircle2, XCircle, Clock, TrendingUp, Award,
    Phone, Mail, MapPin, GraduationCap, School, ChevronRight,
    AlertTriangle, Info, Zap, Check, X, Home, Hash,
} from 'lucide-react';
import { useStudentAuthStore, getStudentToken } from '@/store/useStudentAuthStore';

/* ── helpers ── */
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function fetchPortal() {
    const token = getStudentToken() || (typeof window !== 'undefined' ? localStorage.getItem('studentToken') : null);
    const res = await fetch(`${API}/api/student/portal/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Session expirée');
    const data = await res.json();
    return data.data;
}

function pct(present: number, total: number) {
    return total === 0 ? 100 : Math.round((present / total) * 100);
}

const TABS = [
    { id: 'profil',    icon: User,       label: 'Profil' },
    { id: 'presence',  icon: Calendar,   label: 'Présences' },
    { id: 'cours',     icon: BookOpen,   label: 'Cours' },
    { id: 'paiements', icon: CreditCard, label: 'Paiements' },
    { id: 'alertes',   icon: Bell,       label: 'Alertes' },
] as const;

type Tab = typeof TABS[number]['id'];

const NOTIFICATION_COLORS: Record<string, string> = {
    INFO:    'bg-blue-50 border-blue-200 text-blue-700',
    WARNING: 'bg-amber-50 border-amber-200 text-amber-700',
    URGENT:  'bg-red-50 border-red-200 text-red-600',
};
const NOTIFICATION_ICONS: Record<string, any> = {
    INFO:    Info,
    WARNING: AlertTriangle,
    URGENT:  Zap,
};

export default function StudentDashboard() {
    const router = useRouter();
    const { student, logout, getMe } = useStudentAuthStore();
    const [tab, setTab] = useState<Tab>('profil');
    const [portal, setPortal] = useState<any>(null);
    const [loadingPortal, setLoadingPortal] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Auth guard
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const token = localStorage.getItem('studentToken');
        if (!token) { router.replace('/student/login'); return; }
        getMe();
    }, []);

    // Load portal data
    const loadPortal = useCallback(async () => {
        setLoadingPortal(true);
        try {
            const data = await fetchPortal();
            setPortal(data);
        } catch (e: any) {
            setError(e.message);
            if (e.message === 'Session expirée') { logout(); }
        } finally {
            setLoadingPortal(false);
        }
    }, []);

    useEffect(() => { loadPortal(); }, [loadPortal]);

    if (loadingPortal) return (
        <div className="h-screen flex items-center justify-center bg-[#f5f7ff]">
            <div className="text-center">
                <div className="w-12 h-12 rounded-full border-4 border-[#0a1628] border-t-[#D4AF37] animate-spin mx-auto mb-4" />
                <p className="text-gray-400 font-medium text-sm">Chargement de votre espace...</p>
            </div>
        </div>
    );

    if (error && !portal) return (
        <div className="h-screen flex items-center justify-center bg-[#f5f7ff] p-6">
            <div className="text-center max-w-sm">
                <XCircle size={48} className="text-red-400 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Erreur de chargement</h3>
                <p className="text-gray-400 text-sm mb-4">{error}</p>
                <button onClick={loadPortal} className="px-6 py-2.5 bg-[#0a1628] text-white rounded-xl font-bold text-sm">Réessayer</button>
            </div>
        </div>
    );

    const s = portal?.student;
    const notifications = portal?.notifications || [];
    const attendances = s?.attendances || [];
    const groups = s?.groups || [];
    const payments = s?.payments || [];
    const inscriptions = s?.inscriptions || [];

    const totalDays = attendances.length;
    const presentDays = attendances.filter((a: any) => a.status === 'present').length;
    const attendancePct = pct(presentDays, totalDays);
    const totalPaid = payments.reduce((acc: number, p: any) => acc + p.amount, 0);
    const totalDue = inscriptions.reduce((acc: number, i: any) => acc + i.amount, 0);
    const unreadAlerts = notifications.length;

    return (
        <div className="min-h-screen bg-[#f5f7ff] font-sans">
            {/* ── Top Bar ── */}
            <header className="bg-[#0a1628] sticky top-0 z-30 shadow-xl">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
                    {/* Logo + Title */}
                    <div className="flex items-center gap-3">
                        <div className="p-0.5 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#f0d060]">
                            <div className="bg-white rounded-[10px] p-1">
                                <Image src="/assets/loggo.jpg" alt="Logo" width={28} height={28} className="rounded-lg object-contain" />
                            </div>
                        </div>
                        <div>
                            <p className="text-[#D4AF37] font-black text-sm leading-none">Espace Élève</p>
                            <p className="text-white/40 text-[10px] tracking-wider">Enovazone Acadimeca</p>
                        </div>
                    </div>

                    {/* User + logout */}
                    <div className="flex items-center gap-3">
                        {unreadAlerts > 0 && (
                            <button onClick={() => setTab('alertes')} className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-[#D4AF37] transition-all">
                                <Bell size={17} />
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-black flex items-center justify-center">{unreadAlerts > 9 ? '9+' : unreadAlerts}</span>
                            </button>
                        )}
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
                            <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] text-xs font-black">
                                {s?.name?.[0]}{s?.surname?.[0]}
                            </div>
                            <span className="text-white font-bold text-sm">{s?.name} {s?.surname}</span>
                        </div>
                        <button onClick={logout} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-400 transition-all" title="Déconnexion">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>

                {/* Tab nav */}
                <div className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-1 pb-0 overflow-x-auto">
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                                tab === t.id
                                    ? 'border-[#D4AF37] text-[#D4AF37]'
                                    : 'border-transparent text-white/40 hover:text-white/70'
                            }`}
                        >
                            <t.icon size={14} />
                            {t.label}
                            {t.id === 'alertes' && unreadAlerts > 0 && (
                                <span className="bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{unreadAlerts > 9 ? '9+' : unreadAlerts}</span>
                            )}
                        </button>
                    ))}
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

                {/* ══════════════ PROFIL ══════════════ */}
                {tab === 'profil' && (
                    <div className="space-y-6">
                        {/* Hero card */}
                        <div className="relative bg-[#0a1628] rounded-2xl overflow-hidden shadow-xl">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#1a3a6e_0%,_#0a1628_70%)]" />
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
                            <div className="relative p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                {/* Avatar */}
                                <div className="shrink-0 p-0.5 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#f0d060] shadow-[0_0_30px_rgba(212,175,55,0.4)]">
                                    <div className="w-24 h-24 rounded-full bg-[#0a1628] flex items-center justify-center border-4 border-[#0a1628]">
                                        {s?.photo ? (
                                            <Image src={s.photo} alt="Photo" width={88} height={88} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <span className="text-4xl font-black text-[#D4AF37]">{s?.name?.[0]}{s?.surname?.[0]}</span>
                                        )}
                                    </div>
                                </div>
                                {/* Info */}
                                <div className="text-center sm:text-left flex-1">
                                    <h2 className="text-2xl font-black text-white">{s?.name} {s?.surname}</h2>
                                    {s?.schoolLevel && (
                                        <div className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full text-[#D4AF37] text-xs font-bold">
                                            <GraduationCap size={12} /> {s.schoolLevel}
                                        </div>
                                    )}
                                    <p className="text-white/40 text-sm mt-2 font-medium">Inscrit le {new Date(s?.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                                {/* Stats */}
                                <div className="flex sm:flex-col gap-4 sm:gap-3 text-center">
                                    <div>
                                        <p className="text-[#D4AF37] font-black text-2xl">{attendancePct}%</p>
                                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Présence</p>
                                    </div>
                                    <div>
                                        <p className="text-[#D4AF37] font-black text-2xl">{groups.length}</p>
                                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Groupe{groups.length > 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Details grid */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            {[
                                { icon: Phone, label: 'Téléphone', value: s?.phone },
                                { icon: Mail, label: 'Email', value: s?.email },
                                { icon: MapPin, label: 'Adresse', value: s?.address },
                                { icon: School, label: 'École', value: s?.currentSchool },
                                { icon: User, label: 'Père', value: s?.fatherName },
                                { icon: User, label: 'Mère', value: s?.motherName },
                                { icon: Phone, label: 'Tél. parent', value: s?.parentPhone },
                                { icon: Hash, label: 'N° CIN', value: s?.cin },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="bg-white rounded-xl p-4 border border-gray-100 flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-[#0a1628]/5 flex items-center justify-center shrink-0">
                                        <Icon size={16} className="text-[#0a1628]" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                                        <p className="text-gray-900 font-semibold text-sm mt-0.5">{value || <span className="text-gray-300 italic">—</span>}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ══════════════ PRÉSENCES ══════════════ */}
                {tab === 'presence' && (
                    <div className="space-y-6">
                        {/* Summary cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: 'Taux présence', value: `${attendancePct}%`, sub: 'Général', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                                { label: 'Jours présent', value: presentDays, sub: `sur ${totalDays} jours`, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                                { label: 'Absences', value: totalDays - presentDays, sub: 'jours', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
                                { label: 'Groupes', value: groups.length, sub: 'actifs', color: 'text-[#D4AF37]', bg: 'bg-amber-50', border: 'border-amber-100' },
                            ].map(c => (
                                <div key={c.label} className={`bg-white rounded-2xl p-5 border ${c.border} shadow-sm`}>
                                    <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
                                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">{c.label}</p>
                                    <p className="text-[10px] text-gray-300 mt-0.5">{c.sub}</p>
                                </div>
                            ))}
                        </div>

                        {/* Progress bar */}
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-bold text-gray-700">Taux de présence global</span>
                                <span className={`text-sm font-black ${attendancePct >= 80 ? 'text-emerald-600' : attendancePct >= 60 ? 'text-amber-600' : 'text-red-500'}`}>{attendancePct}%</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${attendancePct >= 80 ? 'bg-emerald-500' : attendancePct >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                                    style={{ width: `${attendancePct}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2">{attendancePct >= 80 ? '✅ Excellent taux de présence' : attendancePct >= 60 ? '⚠️ Peut s\'améliorer' : '❌ Attention — taux insuffisant'}</p>
                        </div>

                        {/* History table */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2"><Calendar size={16} className="text-[#0a1628]" /> Historique des présences</h3>
                                <span className="text-xs text-gray-400">{attendances.length} enregistrements</span>
                            </div>
                            {attendances.length === 0 ? (
                                <div className="p-12 text-center text-gray-300"><Calendar size={36} className="mx-auto mb-3" />Aucun enregistrement</div>
                            ) : (
                                <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                                    {attendances.slice(0, 30).map((a: any) => (
                                        <div key={a.id} className={`flex items-center justify-between px-5 py-3 ${a.status === 'absent' ? 'bg-red-50/40' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                {a.status === 'present' ? (
                                                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                                ) : (
                                                    <XCircle size={16} className="text-red-400 shrink-0" />
                                                )}
                                                <span className="text-sm font-medium text-gray-800">
                                                    {new Date(a.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                </span>
                                            </div>
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${a.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                                                {a.status === 'present' ? 'Présent' : 'Absent'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ══════════════ COURS ══════════════ */}
                {tab === 'cours' && (
                    <div className="space-y-4">
                        {groups.length === 0 ? (
                            <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
                                <BookOpen size={40} className="text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400 font-medium">Aucun groupe assigné pour l'instant.</p>
                            </div>
                        ) : (
                            groups.map((g: any) => (
                                <div key={g.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    {/* Gold top border per group */}
                                    <div className="h-1 bg-gradient-to-r from-[#0a1628] via-[#D4AF37] to-[#0a1628]" />
                                    <div className="p-6">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-[#0a1628] flex items-center justify-center shrink-0">
                                                    <BookOpen size={20} className="text-[#D4AF37]" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-base">{g.name}</h3>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {g.subject && <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">{g.subject}</span>}
                                                        {g.level && <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full">{g.level}</span>}
                                                        {g.type && <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full">{g.type}</span>}
                                                        {g.room && <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">Salle {g.room}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            {g.whatsappUrl && (
                                                <a href={g.whatsappUrl} target="_blank" rel="noreferrer"
                                                    className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white text-xs font-bold rounded-xl hover:bg-[#1ebe5d] transition-colors shrink-0">
                                                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.007 22l4.988-1.31A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
                                                    Groupe WhatsApp
                                                </a>
                                            )}
                                        </div>

                                        {/* Formateur */}
                                        {g.teacher && (
                                            <div className="mt-5 pt-4 border-t border-gray-50 flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] text-sm font-black shrink-0">
                                                    {g.teacher.name[0]}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Formateur</p>
                                                    <p className="text-sm font-bold text-gray-800">{g.teacher.name}</p>
                                                </div>
                                                {g.teacher.specialties?.length > 0 && (
                                                    <div className="ml-auto flex gap-1 flex-wrap justify-end">
                                                        {g.teacher.specialties.slice(0, 3).map((sp: string) => (
                                                            <span key={sp} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-full">{sp}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Time Slots */}
                                        {g.timeSlots?.length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Horaires</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {g.timeSlots.map((ts: any, i: number) => (
                                                        <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a1628]/5 rounded-xl text-xs font-bold text-[#0a1628]">
                                                            <Clock size={11} />
                                                            {ts.day} · {ts.startTime} – {ts.endTime}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Formation */}
                                        {g.formation && (
                                            <div className="mt-4 p-4 bg-[#f5f7ff] rounded-xl border border-[#0a1628]/10">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Formation</p>
                                                <p className="font-bold text-gray-900 text-sm">{g.formation.name}</p>
                                                {g.formation.duration && <p className="text-xs text-gray-400 mt-1">Durée : {g.formation.duration}</p>}
                                                {g.formation.description && <p className="text-xs text-gray-500 mt-1">{g.formation.description}</p>}
                                                {g.formation.price && (
                                                    <p className="text-xs font-black text-[#D4AF37] mt-2">{g.formation.price.toLocaleString('fr-MA')} MAD</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* ══════════════ PAIEMENTS ══════════════ */}
                {tab === 'paiements' && (
                    <div className="space-y-6">
                        {/* Summary */}
                        <div className="grid sm:grid-cols-3 gap-4">
                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                                <p className="text-2xl font-black text-[#0a1628]">{totalPaid.toLocaleString('fr-MA')} <span className="text-base text-gray-400">MAD</span></p>
                                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">Total payé</p>
                            </div>
                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                                <p className="text-2xl font-black text-amber-600">{totalDue.toLocaleString('fr-MA')} <span className="text-base text-gray-400">MAD</span></p>
                                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">Total dû</p>
                            </div>
                            <div className={`rounded-2xl p-5 border shadow-sm ${totalPaid >= totalDue ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                                <p className={`text-2xl font-black ${totalPaid >= totalDue ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {Math.max(0, totalDue - totalPaid).toLocaleString('fr-MA')} <span className="text-base opacity-60">MAD</span>
                                </p>
                                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">Reste à payer</p>
                            </div>
                        </div>

                        {/* Payment history */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-50">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2"><CreditCard size={16} className="text-[#0a1628]" /> Historique des paiements</h3>
                            </div>
                            {payments.length === 0 ? (
                                <div className="p-12 text-center text-gray-300"><CreditCard size={36} className="mx-auto mb-3" />Aucun paiement</div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead><tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Méthode</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Note</th>
                                        <th className="px-5 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Montant</th>
                                    </tr></thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {payments.map((p: any) => (
                                            <tr key={p.id}>
                                                <td className="px-5 py-3.5 text-gray-500 text-xs">{new Date(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                                <td className="px-5 py-3.5"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">{p.method}</span></td>
                                                <td className="px-5 py-3.5 text-gray-400 text-xs">{p.note || '—'}</td>
                                                <td className="px-5 py-3.5 text-right font-black text-[#0a1628]">{p.amount.toLocaleString('fr-MA')} MAD</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Inscriptions */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-50">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2"><Award size={16} className="text-[#D4AF37]" /> Inscriptions / Frais</h3>
                            </div>
                            {inscriptions.length === 0 ? (
                                <div className="p-12 text-center text-gray-300">Aucune inscription</div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {inscriptions.map((ins: any) => (
                                        <div key={ins.id} className="px-5 py-4 flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{ins.category}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{ins.type} · {new Date(ins.date).toLocaleDateString('fr-FR')}</p>
                                                {ins.note && <p className="text-xs text-gray-400">{ins.note}</p>}
                                            </div>
                                            <span className="font-black text-[#0a1628]">{ins.amount.toLocaleString('fr-MA')} MAD</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ══════════════ ALERTES ══════════════ */}
                {tab === 'alertes' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-gray-900 flex items-center gap-2"><Bell size={18} className="text-[#0a1628]" /> Messages de l'administration</h2>
                            <span className="text-sm text-gray-400">{notifications.length} message{notifications.length !== 1 ? 's' : ''}</span>
                        </div>

                        {notifications.length === 0 ? (
                            <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
                                <Bell size={40} className="text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400 font-medium">Aucun message de l'administration</p>
                                <p className="text-gray-300 text-sm mt-1">Vous serez notifié ici des annonces importantes</p>
                            </div>
                        ) : (
                            notifications.map((n: any) => {
                                const colorClass = NOTIFICATION_COLORS[n.type] || NOTIFICATION_COLORS.INFO;
                                const Icon = NOTIFICATION_ICONS[n.type] || Info;
                                return (
                                    <div key={n.id} className={`rounded-2xl border p-5 ${colorClass}`}>
                                        <div className="flex items-start gap-3">
                                            <Icon size={20} className="shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                                    <h4 className="font-bold text-sm">{n.title}</h4>
                                                    <span className="text-[10px] font-bold opacity-50">{new Date(n.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                                <p className="text-sm mt-1.5 opacity-80 leading-relaxed">{n.message}</p>
                                                <p className="text-[10px] opacity-40 mt-2 font-bold">— {n.createdBy}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </main>

            {/* Bottom mobile nav */}
            <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-[#0a1628] border-t border-white/10 flex z-30">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-[9px] font-black uppercase tracking-wider transition-colors relative ${tab === t.id ? 'text-[#D4AF37]' : 'text-white/30'}`}
                    >
                        <t.icon size={18} />
                        {t.label}
                        {t.id === 'alertes' && unreadAlerts > 0 && (
                            <span className="absolute top-1 right-1/4 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] text-white font-black flex items-center justify-center">{unreadAlerts > 9 ? '9+' : unreadAlerts}</span>
                        )}
                    </button>
                ))}
            </nav>
            <div className="sm:hidden h-16" />
        </div>
    );
}
