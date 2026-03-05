'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    Users, BookOpen, Calendar, CreditCard, Bell, LogOut,
    CheckCircle2, XCircle, Clock, TrendingUp,
    Phone, Mail, MapPin, GraduationCap, School, ChevronRight,
    AlertTriangle, Info, Zap, Home, Hash,
} from 'lucide-react';
import { useParentAuthStore, getParentToken } from '@/store/useParentAuthStore';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

async function fetchChildPortal() {
    const token = getParentToken() || localStorage.getItem('parentToken');
    const res = await fetch(`${API}/parent/portal/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
}

function pct(present: number, total: number) {
    if (!total) return 0;
    return Math.round((present / total) * 100);
}

type Tab = 'accueil' | 'presence' | 'paiements' | 'cours' | 'notifications';

const TABS: { id: Tab; icon: any; label: string }[] = [
    { id: 'accueil', icon: Home, label: 'Accueil' },
    { id: 'presence', icon: Calendar, label: 'Présences' },
    { id: 'paiements', icon: CreditCard, label: 'Paiements' },
    { id: 'cours', icon: BookOpen, label: 'Cours' },
    { id: 'notifications', icon: Bell, label: 'Messages' },
];

export default function ParentDashboardPage() {
    const router = useRouter();
    const { parent, loading: storeLoading, getMe, logout } = useParentAuthStore();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('accueil');

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('parentToken') : null;
        if (!token) { router.replace('/parent/login'); return; }
        getMe();
    }, []);

    const load = useCallback(async () => {
        try {
            const res = await fetchChildPortal();
            setData(res.data);
        } catch {
            router.replace('/parent/login');
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => { load(); }, [load]);

    if (loading || storeLoading || !data) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 font-medium">Chargement du portail parent...</p>
                </div>
            </div>
        );
    }

    const { student, notifications } = data;
    const attendances: any[] = student.attendances || [];
    const presentCount = attendances.filter((a: any) => a.status === 'present').length;
    const absentCount = attendances.filter((a: any) => a.status === 'absent').length;
    const presencePct = pct(presentCount, attendances.length);
    const payments: any[] = student.payments || [];
    const totalPaid = payments.reduce((s: number, p: any) => s + p.amount, 0);
    const groups: any[] = student.groups || [];
    const initials = (parent?.name || 'P').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
    const childInitials = `${student.name?.[0] || ''}${student.surname?.[0] || ''}`.toUpperCase();

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)' }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#064e3b] via-[#065f46] to-[#064e3b] text-white">
                <div className="px-6 py-4 flex items-center justify-between">
                    <span className="text-sm text-emerald-300 font-semibold tracking-wide">Espace Parent</span>
                    <button onClick={logout} className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition font-medium">
                        <LogOut size={15} />
                        <span className="hidden sm:inline">Déconnexion</span>
                    </button>
                </div>

                <div className="px-6 pb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white font-black text-xl shadow-xl shadow-emerald-500/30">
                        {initials}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-black text-white">{parent?.name || 'Parent'}</h1>
                        <p className="text-emerald-300/80 text-sm">Suivi de : <span className="font-bold text-emerald-200">{student.name} {student.surname}</span></p>
                        {student.schoolLevel && <p className="text-emerald-400/60 text-xs mt-0.5">{student.schoolLevel} — {student.currentSchool}</p>}
                    </div>
                    {/* Child avatar */}
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-2xl px-4 py-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-sm">{childInitials}</div>
                        <div>
                            <p className="text-white font-bold text-sm">{student.name} {student.surname}</p>
                            <p className="text-emerald-300 text-xs">{student.schoolLevel}</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto border-t border-white/10">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${activeTab === tab.id
                                    ? 'border-emerald-400 text-emerald-300 bg-white/5'
                                    : 'border-transparent text-white/50 hover:text-white/80'}`}>
                                <Icon size={15} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

                {/* ── ACCUEIL ── */}
                {activeTab === 'accueil' && (
                    <div className="space-y-5">
                        {/* KPI cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Présence</p>
                                <p className="text-3xl font-black text-emerald-600 mt-1">{presencePct}%</p>
                                <p className="text-xs text-slate-400 mt-1">{presentCount} présent / {absentCount} absent</p>
                            </div>
                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Paiements</p>
                                <p className="text-3xl font-black text-blue-600 mt-1">{totalPaid.toLocaleString('fr-FR')} MAD</p>
                                <p className="text-xs text-slate-400 mt-1">{payments.length} versement(s)</p>
                            </div>
                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 col-span-2 sm:col-span-1">
                                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Groupes</p>
                                <p className="text-3xl font-black text-purple-600 mt-1">{groups.length}</p>
                                <p className="text-xs text-slate-400 mt-1">cours actifs</p>
                            </div>
                        </div>

                        {/* Child info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Profil de l'élève</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                {[
                                    { icon: GraduationCap, label: 'Niveau', val: student.schoolLevel },
                                    { icon: School, label: 'École', val: student.currentSchool },
                                    { icon: Phone, label: 'Téléphone', val: student.phone },
                                    { icon: Mail, label: 'Email', val: student.email },
                                    { icon: MapPin, label: 'Adresse', val: student.address },
                                ].filter(r => r.val).map(row => (
                                    <div key={row.label} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                                            <row.icon size={14} className="text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">{row.label}</p>
                                            <p className="font-semibold text-slate-700">{row.val}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent absences */}
                        {absentCount > 0 && (
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle size={16} className="text-red-500" />
                                    <h3 className="text-sm font-bold text-red-700">Absences récentes</h3>
                                </div>
                                <div className="space-y-2">
                                    {attendances.filter((a: any) => a.status === 'absent').slice(0, 5).map((a: any) => (
                                        <div key={a.id} className="flex items-center justify-between text-sm">
                                            <span className="text-red-600">{new Date(a.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                                            <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold">Absent</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── PRÉSENCES ── */}
                {activeTab === 'presence' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-700">Historique des présences</h3>
                            <span className="text-sm font-bold text-emerald-600">{presencePct}% de présence</span>
                        </div>
                        {attendances.length === 0 ? (
                            <p className="text-center text-slate-400 py-12">Aucune donnée de présence</p>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {attendances.map((a: any) => (
                                    <div key={a.id} className="flex items-center justify-between px-5 py-3.5">
                                        <span className="text-sm text-slate-600">{new Date(a.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        {a.status === 'present'
                                            ? <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full"><CheckCircle2 size={12} />Présent</span>
                                            : <span className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-full"><XCircle size={12} />Absent</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── PAIEMENTS ── */}
                {activeTab === 'paiements' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-700">Historique des paiements</h3>
                            <span className="text-sm font-bold text-blue-600">{totalPaid.toLocaleString('fr-FR')} MAD total</span>
                        </div>
                        {payments.length === 0 ? (
                            <p className="text-center text-slate-400 py-12">Aucun paiement enregistré</p>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {payments.map((p: any) => (
                                    <div key={p.id} className="flex items-center justify-between px-5 py-4">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">{p.note || 'Paiement'}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{new Date(p.date).toLocaleDateString('fr-FR')} · {p.method}</p>
                                        </div>
                                        <span className="text-sm font-black text-blue-600">{p.amount.toLocaleString('fr-FR')} MAD</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── COURS ── */}
                {activeTab === 'cours' && (
                    <div className="space-y-4">
                        {groups.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
                                <BookOpen size={36} className="mx-auto text-slate-200 mb-3" />
                                <p className="text-slate-400">Aucun cours assigné</p>
                            </div>
                        ) : groups.map((g: any) => (
                            <div key={g.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div>
                                        <h3 className="font-bold text-slate-800">{g.name}</h3>
                                        <div className="flex flex-wrap gap-2 mt-1.5">
                                            {g.subject && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">{g.subject}</span>}
                                            {g.level && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">{g.level}</span>}
                                            {g.room && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full"><Hash size={10} className="inline" />{g.room}</span>}
                                        </div>
                                    </div>
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${g.type === 'FORMATION' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {g.type === 'FORMATION' ? 'Formation' : 'Soutien'}
                                    </span>
                                </div>
                                {g.teacher && (
                                    <p className="text-xs text-slate-500 mb-3">Professeur : <span className="font-semibold text-slate-700">{g.teacher.name}</span></p>
                                )}
                                {(g.timeSlots || []).length > 0 && (
                                    <div className="space-y-1.5">
                                        {g.timeSlots.map((slot: any, i: number) => (
                                            <div key={i} className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                                                <Clock size={12} className="text-slate-400" />
                                                <span className="font-semibold">{slot.day}</span>
                                                <span>{slot.startTime} — {slot.endTime}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* ── NOTIFICATIONS ── */}
                {activeTab === 'notifications' && (
                    <div className="space-y-4">
                        {notifications.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                                <Bell size={36} className="mx-auto text-slate-300 mb-3" />
                                <p className="text-slate-400 font-medium">Aucun message reçu</p>
                            </div>
                        ) : notifications.map((n: any) => {
                            const colors: Record<string, string> = {
                                INFO: 'bg-blue-50 border-blue-100 text-blue-700',
                                WARNING: 'bg-amber-50 border-amber-100 text-amber-700',
                                URGENT: 'bg-red-50 border-red-100 text-red-600',
                            };
                            const icons: Record<string, any> = { INFO: Info, WARNING: AlertTriangle, URGENT: Zap };
                            const Icon = icons[n.type] || Info;
                            return (
                                <div key={n.id} className={`rounded-2xl border p-5 ${colors[n.type] || colors.INFO}`}>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-white/50 flex items-center justify-center flex-shrink-0">
                                            <Icon size={15} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{n.title}</p>
                                            <p className="text-sm mt-0.5 opacity-80">{n.message}</p>
                                            <p className="text-xs mt-2 opacity-60">{new Date(n.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
