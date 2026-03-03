'use client';

import { useState, useEffect } from 'react';
import { Calendar, Printer, Save, CheckCircle2, XCircle, RefreshCw, UserCheck, Users } from 'lucide-react';
import { groupsService } from '@/lib/services/groups';
import { bulkSaveAttendance, getAttendanceByGroup } from '@/lib/services/attendance';

interface Student {
    id: string;
    name: string;
    surname: string;
    phone?: string;
}

interface Group {
    id: string;
    name: string;
    subject?: string;
    level?: string;
    teacher?: { name: string };
    room?: string;
    students: Student[];
    _count: { students: number };
}

export default function PresencePage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, 'present' | 'absent'>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Load all groups once
    useEffect(() => {
        const load = async () => {
            try {
                const [soutien, formation] = await Promise.all([
                    groupsService.getAll('SOUTIEN'),
                    groupsService.getAll('FORMATION'),
                ]);
                setGroups([...soutien, ...formation]);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Load attendance from API when group or date changes
    useEffect(() => {
        if (!selectedGroup || !attendanceDate) return;
        const grp = groups.find(g => g.id === selectedGroup);
        if (!grp) return;

        // Default everyone to present
        const defaultMap: Record<string, 'present' | 'absent'> = {};
        grp.students.forEach(s => { defaultMap[s.id] = 'present'; });
        setAttendanceMap(defaultMap);

        getAttendanceByGroup(selectedGroup, attendanceDate).then(res => {
            if (res?.attendances?.length) {
                const fresh = { ...defaultMap };
                res.attendances.forEach((a: any) => { fresh[a.studentId] = a.status; });
                setAttendanceMap(fresh);
            }
        }).catch(() => {});
    }, [selectedGroup, attendanceDate, groups]);

    const saveAttendance = async () => {
        const grp = groups.find(g => g.id === selectedGroup);
        if (!grp) return;
        setSaving(true);
        try {
            await bulkSaveAttendance(grp.students.map(s => ({
                studentId: s.id,
                date: attendanceDate,
                status: attendanceMap[s.id] || 'present',
            })));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const grp = groups.find(g => g.id === selectedGroup);
    const presentCount = Object.values(attendanceMap).filter(v => v === 'present').length;
    const absentCount = grp ? grp.students.length - presentCount : 0;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <UserCheck className="text-blue-600" size={26} />
                        Gestion de Présence
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">Feuille de présence quotidienne — synchronisée avec les formateurs</p>
                </div>
                <div className="flex items-center gap-3">
                    {grp && (
                        <>
                            <button
                                onClick={saveAttendance}
                                disabled={saving}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-60 ${saved ? 'bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                            >
                                {saving ? <RefreshCw size={16} className="animate-spin" /> : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                                {saving ? 'Enregistrement...' : saved ? 'Enregistré !' : 'Enregistrer'}
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
                            >
                                <Printer size={16} /> Imprimer
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 print:hidden">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Groupe</label>
                        {loading ? (
                            <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                        ) : (
                            <select
                                value={selectedGroup}
                                onChange={e => { setSelectedGroup(e.target.value); setSaved(false); }}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white text-sm font-medium"
                            >
                                <option value="">— Choisir un groupe —</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>
                                        {g.name}{g.subject ? ` — ${g.subject}` : ''}{g.level ? ` (${g.level})` : ''} · {g._count.students} élèves
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Date</label>
                        <input
                            type="date"
                            value={attendanceDate}
                            onChange={e => { setAttendanceDate(e.target.value); setSaved(false); }}
                            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* Empty state */}
            {!selectedGroup && (
                <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Sélectionnez un groupe</h3>
                    <p className="text-gray-400 mt-2 text-sm">Les données de présence sont partagées en temps réel avec les formateurs.</p>
                </div>
            )}

            {/* Attendance Sheet */}
            {grp && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Sheet header */}
                    <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">{grp.name}</h3>
                            <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                                {grp.subject && <span>📚 {grp.subject}</span>}
                                {grp.level && <span>🎓 {grp.level}</span>}
                                {grp.teacher && <span>👤 {grp.teacher.name}</span>}
                                {grp.room && <span>🚪 {grp.room}</span>}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                {new Date(attendanceDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5 font-bold text-emerald-600 text-sm"><CheckCircle2 size={16} /> {presentCount} présents</span>
                            <span className="flex items-center gap-1.5 font-bold text-red-500 text-sm"><XCircle size={16} /> {absentCount} absents</span>
                            <button
                                onClick={() => { const all: Record<string, 'present' | 'absent'> = {}; grp.students.forEach(s => { all[s.id] = 'present'; }); setAttendanceMap(all); }}
                                className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-colors print:hidden"
                            >
                                Tous présents
                            </button>
                            <button
                                onClick={() => { const all: Record<string, 'present' | 'absent'> = {}; grp.students.forEach(s => { all[s.id] = 'absent'; }); setAttendanceMap(all); }}
                                className="px-3 py-1.5 bg-red-50 text-red-500 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors print:hidden"
                            >
                                Tous absents
                            </button>
                        </div>
                    </div>

                    {grp.students.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <Users size={40} className="mx-auto mb-3 text-gray-200" />
                            Aucun élève dans ce groupe
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {grp.students.map((s, idx) => {
                                const status = attendanceMap[s.id] || 'present';
                                return (
                                    <div key={s.id} className={`flex items-center justify-between px-5 py-3.5 transition-colors ${status === 'present' ? 'bg-white hover:bg-emerald-50/30' : 'bg-red-50/40 hover:bg-red-50'}`}>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-gray-300 font-mono w-5 text-center">{idx + 1}</span>
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-500'}`}>
                                                {s.name[0]}{s.surname[0]}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{s.name} {s.surname}</p>
                                                {s.phone && <p className="text-xs text-gray-400">{s.phone}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 print:hidden">
                                            <button
                                                onClick={() => setAttendanceMap(p => ({ ...p, [s.id]: 'present' }))}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${status === 'present' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
                                            >
                                                <CheckCircle2 size={14} /> Présent
                                            </button>
                                            <button
                                                onClick={() => setAttendanceMap(p => ({ ...p, [s.id]: 'absent' }))}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${status === 'absent' ? 'bg-red-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500'}`}
                                            >
                                                <XCircle size={14} /> Absent
                                            </button>
                                        </div>
                                        {/* Print view */}
                                        <div className="hidden print:block font-bold text-lg">
                                            {status === 'present' ? '✓' : '✗'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {grp.students.length > 0 && (
                        <div className="p-5 border-t border-gray-100 flex justify-end print:hidden">
                            <button
                                onClick={saveAttendance}
                                disabled={saving}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-60 ${saved ? 'bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                            >
                                {saving ? <RefreshCw size={16} className="animate-spin" /> : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                                {saving ? 'Enregistrement...' : saved ? 'Enregistré !' : 'Enregistrer la présence'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 10mm; }
                    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
}
