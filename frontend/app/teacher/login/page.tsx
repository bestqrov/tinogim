'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTeacherAuthStore } from '../../../store/useTeacherAuthStore';
import Image from 'next/image';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

export default function TeacherLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const login = useTeacherAuthStore(state => state.login);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('teacherToken');
            if (token) router.replace('/teacher/dashboard');
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!email.trim() || !password) {
            setError('Veuillez renseigner votre email et mot de passe.');
            return;
        }
        setIsLoading(true);
        const res = await login(email.trim(), password);
        setIsLoading(false);
        if (!res.success) {
            setError(res.message || 'Email ou mot de passe incorrect.');
            return;
        }
        router.push('/teacher/dashboard');
    };

    return (
        <div className="h-screen flex flex-col lg:flex-row bg-white font-sans text-slate-900 overflow-hidden">
            {/* Left: Branded Panel */}
            <div className="hidden lg:flex lg:w-1/2 h-full relative bg-slate-900 items-center justify-center p-12 overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-950 via-slate-900/95 to-slate-900/90" />
                </div>
                <div className="relative z-10 text-center max-w-lg px-8">
                    <div className="flex justify-center mb-8">
                        <div className="p-3 bg-white rounded-2xl shadow-[0_16px_48px_-8px_rgba(0,0,0,0.4)]">
                            <Image src="/assets/loggo.jpg" alt="Enova Logo" width={80} height={80} className="rounded-xl object-contain" />
                        </div>
                    </div>
                    <h2 className="text-5xl font-black text-white mb-6 tracking-tight leading-tight">
                        Espace<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
                            Formateur
                        </span>
                    </h2>
                    <div className="h-1.5 w-24 bg-amber-500 rounded-full mx-auto mb-8 shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
                    <p className="text-amber-100/60 text-lg font-medium leading-relaxed">
                        Accédez à votre espace personnel pour gérer vos groupes et présences.
                    </p>
                </div>
                <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center text-white/20 text-[10px] font-black tracking-[0.4em] uppercase font-mono">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-[1px] bg-white/20" />
                        <span>Portail Formateur</span>
                        <div className="w-8 h-[1px] bg-white/20" />
                    </div>
                </div>
            </div>

            {/* Right: Login Form */}
            <div className="w-full lg:w-1/2 h-screen flex flex-col px-8 sm:px-16 lg:px-24 py-8 bg-white relative overflow-y-auto">
                <div className="max-w-md w-full mx-auto flex flex-col h-full justify-center">
                    {/* Mobile logo */}
                    <div className="flex lg:hidden items-center gap-2 mb-8">
                        <Image src="/assets/loggo.jpg" alt="Enova Logo" width={32} height={32} className="rounded-md object-contain" />
                        <span className="font-black text-slate-900 text-xl">Espace Formateur</span>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-slate-900 mb-2">Connexion</h1>
                        <p className="text-slate-400 text-sm">
                            Connectez-vous avec les identifiants fournis par l&apos;administration.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
                            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-red-600 text-xs font-bold">!</span>
                            </div>
                            <p className="text-sm text-red-700 font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Adresse email
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="votre@email.com"
                                    autoComplete="email"
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition bg-slate-50"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    required
                                    className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition bg-slate-50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold rounded-xl transition text-sm shadow-lg shadow-amber-200 mt-2"
                        >
                            {isLoading ? 'Connexion...' : 'Se connecter'}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-xs text-slate-400">
                        Vous n&apos;avez pas encore de compte ?{' '}
                        <span className="text-slate-600 font-medium">
                            Contactez votre administrateur.
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}
