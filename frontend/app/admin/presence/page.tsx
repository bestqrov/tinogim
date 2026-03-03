'use client';

import { useState, useEffect } from 'react';
import { Calendar, Printer, Save, CheckCircle2, RefreshCw, UserCheck, Users, Check } from 'lucide-react';
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
}

export default function PresencePage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});
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
        const defaultMap: Record<string, boolean> = {};
        grp.students.forEach(s => { defaultMap[s.id] = true; });
        setAttendanceMap(defaultMap);

        getAttendanceByGroup(selectedGroup, attendanceDate).then(res => {
            if (res?.attendances?.length) {
                const fresh = { ...defaultMap };
                res.attendances.forEach((a: any) => { fresh[a.studentId] = a.status === 'present'; });
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
                status: attendanceMap[s.id] !== false ? 'present' : 'absent',
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
    const presentCount = Object.values(attendanceMap).filter(Boolean).length;
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
                                        {g.name}{g.subject ? ` — ${g.subject}` : ''}{g.level ? ` (${g.level})` : ''} · {g.students.length} élèves
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
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">{presentCount} présents</span>
                            <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full">{absentCount} absents</span>
                            <button
                                onClick={() => { const all: Record<string, boolean> = {}; grp.students.forEach(s => { all[s.id] = true; }); setAttendanceMap(all); }}
                                className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-colors print:hidden"
                            >
                                Tous présents
                            </button>
                            <button
                                onClick={() => { const all: Record<string, boolean> = {}; grp.students.forEach(s => { all[s.id] = false; }); setAttendanceMap(all); }}
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
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-10">#</th>
                                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Élève</th>
                                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Téléphone</th>
                                    <th className="px-5 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider w-28">Présent</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {grp.students.map((s, idx) => {
                                    const isPresent = attendanceMap[s.id] !== false;
                                    return (
                                        <tr
                                            key={s.id}
                                            onClick={() => setAttendanceMap(p => ({ ...p, [s.id]: !p[s.id] }))}
                                            className={`cursor-pointer transition-colors ${isPresent ? 'hover:bg-emerald-50/40' : 'bg-red-50/30 hover:bg-red-50/60'}`}
                                        >
                                            <td className="px-5 py-3.5 text-gray-400 font-mono text-xs">{idx + 1}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-colors ${isPresent ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-500'}`}>
                                                        {s.name[0]}{s.surname[0]}
                                                    </div>
                                                    <span className={`font-semibold transition-colors ${isPresent ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                                                        {s.name} {s.surname}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-400 text-xs hidden sm:table-cell">{s.phone || '—'}</td>
                                            <td className="px-5 py-3.5 print:hidden">
                                                <div className={`w-7 h-7 rounded-md border-2 flex items-center justify-center mx-auto transition-all ${
                                                    isPresent
                                                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-200'
                                                        : 'bg-white border-gray-300 text-transparent hover:border-emerald-400'
                                                }`}>
                                                    <Check size={14} strokeWidth={3} />
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-center hidden print:table-cell font-bold text-lg">
                                                {isPresent ? '✓' : '✗'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
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
