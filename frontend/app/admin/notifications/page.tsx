'use client';
import { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Info, AlertTriangle, Zap, Send } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    INFO:    { label: 'Information', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: Info },
    WARNING: { label: 'Avertissement', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: AlertTriangle },
    URGENT:  { label: 'Urgent', color: 'bg-red-50 text-red-600 border-red-100', icon: Zap },
};

export default function AdminNotificationsPage() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', message: '', type: 'INFO' });
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            setNotifications(data.data || []);
        } catch {}
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.message) return;
        setSaving(true);
        try {
            await fetch(`${API}/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...form, targetAll: true }),
            });
            setForm({ title: '', message: '', type: 'INFO' });
            setShowForm(false);
            load();
        } catch {}
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer ce message ?')) return;
        await fetch(`${API}/notifications/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Bell className="text-blue-600" size={26} /> Alertes &amp; Notifications
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Messages envoyés à tous les élèves via leur portail</p>
                </div>
                <button
                    onClick={() => setShowForm(s => !s)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm"
                >
                    <Plus size={16} /> Nouveau message
                </button>
            </div>

            {/* New notification form */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Send size={16} /> Envoyer un message aux élèves</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Titre</label>
                                <input
                                    value={form.title}
                                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="Titre du message"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Type</label>
                                <select
                                    value={form.type}
                                    onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                                >
                                    <option value="INFO">ℹ️ Information</option>
                                    <option value="WARNING">⚠️ Avertissement</option>
                                    <option value="URGENT">🚨 Urgent</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Message</label>
                            <textarea
                                value={form.message}
                                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                                rows={4}
                                placeholder="Contenu du message..."
                                required
                            />
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50">Annuler</button>
                            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl disabled:opacity-60 flex items-center gap-2">
                                <Send size={14} /> {saving ? 'Envoi...' : 'Envoyer à tous les élèves'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
            ) : notifications.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                    <Bell size={40} className="text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">Aucun message envoyé</p>
                    <p className="text-gray-300 text-sm mt-1">Utilisez le bouton ci-dessus pour envoyer une alerte</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map(n => {
                        const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.INFO;
                        const Icon = cfg.icon;
                        return (
                            <div key={n.id} className={`rounded-2xl border p-5 ${cfg.color} flex items-start gap-4`}>
                                <Icon size={20} className="shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <h4 className="font-bold text-sm">{n.title}</h4>
                                        <span className="text-[10px] font-bold opacity-50">{new Date(n.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-sm mt-1 opacity-80 leading-relaxed">{n.message}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="text-[10px] opacity-40 font-bold">— {n.createdBy} · {n.targetAll ? 'Tous les élèves' : `${n.studentIds?.length} élève(s)`}</p>
                                        <button onClick={() => handleDelete(n.id)} className="text-xs font-bold opacity-40 hover:opacity-80 flex items-center gap-1 transition-opacity">
                                            <Trash2 size={12} /> Supprimer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
