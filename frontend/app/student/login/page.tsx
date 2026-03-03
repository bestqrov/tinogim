'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, User, Lock, GraduationCap, BookOpen, Star } from 'lucide-react';
import { useStudentAuthStore } from '@/store/useStudentAuthStore';

export default function StudentLoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const login = useStudentAuthStore(s => s.login);

    useEffect(() => {
        if (typeof window !== 'undefined' && localStorage.getItem('studentToken')) {
            router.replace('/student/dashboard');
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!username.trim() || !password) { setError('Identifiant et mot de passe requis.'); return; }
        setLoading(true);
        const res = await login(username.trim(), password);
        setLoading(false);
        if (!res.success) { setError(res.message || 'Identifiant ou mot de passe incorrect.'); return; }
        router.push('/student/dashboard');
    };

    return (
        <div className="h-screen flex flex-col lg:flex-row overflow-hidden font-sans">
            {/* ── Left Panel ── */}
            <div className="hidden lg:flex lg:w-[52%] h-full relative flex-col items-center justify-center overflow-hidden bg-[#0a1628]">
                {/* Deep background pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#1a3a6e_0%,_#0a1628_60%)]" />
                <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-900/30 rounded-full blur-3xl" />

                {/* Gold accent bar top */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

                <div className="relative z-10 text-center max-w-md px-10 flex flex-col items-center">
                    {/* Logo */}
                    <div className="mb-8 p-0.5 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#f0d060] shadow-[0_0_40px_rgba(212,175,55,0.3)]">
                        <div className="bg-white rounded-[14px] p-3">
                            <Image src="/assets/loggo.jpg" alt="Logo" width={72} height={72} className="rounded-xl object-contain" />
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
                        Espace <span className="text-[#D4AF37]">Élève</span>
                    </h1>
                    <div className="h-0.5 w-20 bg-gradient-to-r from-[#D4AF37] to-[#f0d060] rounded-full mx-auto mb-6" />
                    <p className="text-white/50 font-medium leading-relaxed text-sm">
                        Consultez vos cours, présences, paiements et les messages de l'administration.
                    </p>

                    {/* Feature pills */}
                    <div className="mt-10 flex flex-wrap gap-3 justify-center">
                        {[
                            { icon: BookOpen, label: 'Mes Cours' },
                            { icon: GraduationCap, label: 'Présences' },
                            { icon: Star, label: 'Paiements' },
                        ].map(({ icon: Icon, label }) => (
                            <div key={label} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/60 text-xs font-bold">
                                <Icon size={13} className="text-[#D4AF37]" />
                                {label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom badge */}
                <div className="absolute bottom-8 flex items-center gap-3 text-white/20 text-[10px] font-black tracking-[0.4em] uppercase">
                    <div className="w-8 h-px bg-white/20" />
                    Portail Élève
                    <div className="w-8 h-px bg-white/20" />
                </div>
            </div>

            {/* ── Right Panel — Form ── */}
            <div className="w-full lg:w-[48%] flex flex-col bg-[#f5f7ff] h-screen overflow-y-auto">
                <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-20 py-10">
                    <div className="max-w-sm w-full mx-auto">
                        {/* Mobile logo */}
                        <div className="flex lg:hidden items-center gap-2 mb-8">
                            <Image src="/assets/loggo.jpg" alt="Logo" width={32} height={32} className="rounded-lg object-contain" />
                            <span className="font-black text-[#0a1628] text-xl">Espace Élève</span>
                        </div>

                        <h2 className="text-2xl font-black text-[#0a1628] mb-1">Connexion</h2>
                        <p className="text-gray-400 text-sm mb-8">Entrez vos identifiants fournis par l'administration</p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Username */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Identifiant</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-300 outline-none focus:ring-2 focus:ring-[#0a1628]/10 focus:border-[#0a1628] transition-all"
                                        placeholder="exemple: mbouazza"
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Mot de passe</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-11 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-300 outline-none focus:ring-2 focus:ring-[#0a1628]/10 focus:border-[#0a1628] transition-all"
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                    />
                                    <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600">{error}</div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 mt-2 rounded-xl font-bold text-sm transition-all disabled:opacity-60 shadow-md
                                    bg-gradient-to-r from-[#0a1628] to-[#1e3a6e] text-white hover:from-[#0f2040] hover:to-[#2a4a8a]
                                    shadow-[0_4px_20px_rgba(10,22,40,0.3)]"
                            >
                                {loading ? 'Connexion...' : 'Se connecter'}
                            </button>
                        </form>

                        <p className="text-center text-xs text-gray-400 mt-8">
                            Identifiants fournis par votre administration lors de l'inscription.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="py-4 text-center">
                    <p className="text-[10px] text-gray-300 font-bold tracking-widest uppercase">Enovazone Acadimeca — Portail Élève</p>
                </div>
            </div>
        </div>
    );
}
