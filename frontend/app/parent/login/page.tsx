'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, Lock, Users } from 'lucide-react';
import { useParentAuthStore } from '@/store/useParentAuthStore';

export default function ParentLoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const login = useParentAuthStore(s => s.login);

    useEffect(() => {
        if (typeof window !== 'undefined' && localStorage.getItem('parentToken')) {
            router.replace('/parent/dashboard');
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
        router.push('/parent/dashboard');
    };

    return (
        <div className="h-screen flex flex-col lg:flex-row overflow-hidden font-sans">
            {/* Left panel */}
            <div className="hidden lg:flex lg:w-[52%] h-full relative flex-col items-center justify-center overflow-hidden bg-[#0a1628]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#1a5e3a_0%,_#0a1628_60%)]" />
                <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-900/30 rounded-full blur-3xl" />
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

                <div className="relative z-10 text-center max-w-md px-10 flex flex-col items-center">
                    <div className="mb-8 p-0.5 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 shadow-[0_0_40px_rgba(52,211,153,0.3)]">
                        <div className="bg-white rounded-[14px] p-3">
                            <Image src="/assets/loggo.jpg" alt="Logo" width={72} height={72} className="rounded-xl object-contain" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
                        Espace <span className="text-emerald-400">Parent</span>
                    </h1>
                    <div className="h-0.5 w-20 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full mx-auto mb-6" />
                    <p className="text-white/50 font-medium leading-relaxed text-sm">
                        Suivez les présences, paiements et cours de votre enfant en temps réel.
                    </p>

                    <div className="mt-10 grid grid-cols-3 gap-4 w-full max-w-xs">
                        {['Présences', 'Paiements', 'Cours'].map(item => (
                            <div key={item} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                                <p className="text-white/60 text-xs font-medium">{item}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel – form */}
            <div className="flex-1 flex items-center justify-center bg-white px-6 py-10">
                <div className="w-full max-w-sm">
                    {/* Mobile logo */}
                    <div className="flex lg:hidden justify-center mb-8">
                        <Image src="/assets/loggo.jpg" alt="Logo" width={60} height={60} className="rounded-2xl shadow" />
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 mb-1">Connexion Parent</h2>
                    <p className="text-sm text-slate-500 mb-8">Entrez votre identifiant et mot de passe attribués par l'administration.</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Identifiant</label>
                            <div className="relative">
                                <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder="Votre identifiant parent"
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-300/40 focus:border-emerald-400 outline-none transition"
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Mot de passe</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-11 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-300/40 focus:border-emerald-400 outline-none transition"
                                    autoComplete="current-password"
                                />
                                <button type="button" onClick={() => setShowPass(v => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20">
                            {loading ? (
                                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Connexion...</>
                            ) : 'Se connecter'}
                        </button>
                    </form>

                    <p className="text-center text-xs text-slate-400 mt-8">
                        Vos identifiants sont fournis par l'administration de l'établissement.
                    </p>
                    <div className="mt-4 flex flex-col items-center gap-2 text-xs text-slate-400">
                        <a href="/student/login" className="hover:text-emerald-600 transition-colors">→ Portail Élève</a>
                        <a href="/login" className="hover:text-slate-600 transition-colors">→ Espace Administration</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
