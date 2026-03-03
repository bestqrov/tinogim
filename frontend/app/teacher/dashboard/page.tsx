'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTeacherAuthStore } from '../../../store/useTeacherAuthStore';
import { GraduationCap, Users, LogOut, BookOpen } from 'lucide-react';

export default function TeacherDashboardPage() {
    const router = useRouter();
    const { teacher, teacherToken, loading, getMe, logout } = useTeacherAuthStore();

    useEffect(() => {
        if (!teacherToken) {
            router.replace('/teacher/login');
            return;
        }
        if (!teacher) getMe();
    }, [teacherToken, teacher, getMe, router]);

    if (loading || !teacher) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-400 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* TopBar */}
            <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 rounded-xl">
                        <GraduationCap size={24} className="text-amber-500" />
                    </div>
                    <div>
                        <h1 className="font-black text-slate-900 text-lg leading-tight">Espace Formateur</h1>
                        <p className="text-xs text-slate-400">Bienvenue, {teacher.name}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 transition font-medium"
                >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">Déconnexion</span>
                </button>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-10">
                {/* Welcome Card */}
                <div className="bg-gradient-to-br from-amber-500 to-yellow-400 rounded-2xl p-8 text-white mb-8 shadow-lg shadow-amber-200">
                    <p className="text-amber-100 text-sm font-medium mb-1">Bonjour 👋</p>
                    <h2 className="text-3xl font-black mb-2">{teacher.name}</h2>
                    {teacher.email && (
                        <p className="text-amber-100/80 text-sm">{teacher.email}</p>
                    )}
                </div>

                {/* Groups */}
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Users size={18} className="text-amber-500" />
                    Mes Groupes
                </h3>
                {(teacher as any).groups?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(teacher as any).groups.map((group: any) => (
                            <div
                                key={group.id}
                                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-base">{group.name}</h4>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {group._count?.students ?? 0} stagiaire(s)
                                        </p>
                                    </div>
                                    <div className="p-2 bg-amber-50 rounded-xl">
                                        <BookOpen size={18} className="text-amber-500" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400 shadow-sm">
                        <Users size={32} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Aucun groupe assigné pour le moment.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
