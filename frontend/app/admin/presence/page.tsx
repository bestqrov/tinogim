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

            <style jsx global>{`
                @media print {
                    @page { size: A4 portrait; margin: 10mm; }
                    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                    .print\\:hidden { display: none !important; }
                }
            `}</style>
        </div>
    );
}


    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            loadAttendance(selectedGroup.id, selectedMonth);
        }
    }, [selectedGroup, selectedMonth]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load groups from API
            const groupsData = await groupsService.getAll('SOUTIEN'); // Default to SOUTIEN for now or fetch all

            // Map backend data to frontend interface
            const mappedGroups: Group[] = groupsData.map((g: any) => ({
                id: g.id,
                name: g.name,
                subject: g.subject,
                niveau: g.level, // Map level to niveau
                teacherName: g.teacher ? `${g.teacher.name} ${g.teacher.surname || ''}`.trim() : undefined,
                room: g.room,
                studentIds: g.students ? g.students.map((s: any) => s.id) : []
            }));

            setGroups(mappedGroups);

            // Load students from API
            const studentsData = await getStudents();
            setStudents(studentsData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAttendance = (groupId: string, month: string) => {
        const [year, monthNum] = month.split('-');
        const storedAttendance = localStorage.getItem('monthly-attendance');

        if (storedAttendance) {
            const records: MonthlyAttendance[] = JSON.parse(storedAttendance);
            const record = records.find(r => r.groupId === groupId && r.month === monthNum && r.year === year);

            if (record) {
                setAttendance(record.attendance);
            } else {
                initializeAttendance();
            }
        } else {
            initializeAttendance();
        }
    };

    const initializeAttendance = () => {
        if (!selectedGroup) return;

        const newAttendance: MonthlyAttendance['attendance'] = {};
        const groupStudents = students.filter(s => selectedGroup.studentIds.includes(s.id));

        groupStudents.forEach(student => {
            newAttendance[student.id] = {
                week1: { s1: false, s2: false },
                week2: { s1: false, s2: false },
                week3: { s1: false, s2: false },
                week4: { s1: false, s2: false },
                week5: { s1: false, s2: false },
                observation: ''
            };
        });

        setAttendance(newAttendance);
    };

    const toggleAttendance = (studentId: string, week: WeekKey, session: 's1' | 's2') => {
        setAttendance(prev => {
            const studentEntry = prev[studentId];
            if (!studentEntry) return prev;

            return {
                ...prev,
                [studentId]: {
                    ...studentEntry,
                    [week]: {
                        ...studentEntry[week],
                        [session]: !studentEntry[week][session]
                    }
                }
            };
        });
    };

    const updateObservation = (studentId: string, observation: string) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                observation
            }
        }));
    };

    const saveAttendance = () => {
        if (!selectedGroup) return;

        const [year, month] = selectedMonth.split('-');
        const storedAttendance = localStorage.getItem('monthly-attendance');
        let records: MonthlyAttendance[] = storedAttendance ? JSON.parse(storedAttendance) : [];

        records = records.filter(r => !(r.groupId === selectedGroup.id && r.month === month && r.year === year));

        records.push({
            groupId: selectedGroup.id,
            month,
            year,
            attendance
        });

        localStorage.setItem('monthly-attendance', JSON.stringify(records));
        alert('Présence enregistrée avec succès!');
    };

    const handlePrint = () => {
        window.print();
    };

    const groupStudents = selectedGroup
        ? students.filter(s => selectedGroup.studentIds.includes(s.id))
        : [];

    const monthName = new Date(selectedMonth + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    return (
        <div className="p-6 space-y-6">
            {/* Header - Hide on print */}
            <div className="flex justify-between items-center print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">L'Absence de Mois</h1>
                    <p className="text-gray-500">Gestion de présence mensuelle par groupe</p>
                </div>
                <div className="flex items-center gap-4">
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                    {selectedGroup && (
                        <>
                            <Button onClick={saveAttendance} className="bg-green-600 hover:bg-green-700 text-white">
                                <Save size={18} className="mr-2" /> Enregistrer
                            </Button>
                            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Printer size={18} className="mr-2" /> Imprimer
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Group Selection - Hide on print */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 print:hidden">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner un groupe</label>
                <select
                    value={selectedGroup?.id || ''}
                    onChange={(e) => {
                        const group = groups.find(g => g.id === e.target.value);
                        setSelectedGroup(group || null);
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                    <option value="">-- Choisir un groupe --</option>
                    {groups.map(group => (
                        <option key={group.id} value={group.id}>
                            {group.name} - {group.subject} ({group.niveau})
                        </option>
                    ))}
                </select>
            </div>

            {/* Attendance Sheet */}
            {selectedGroup ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-0">
                    {/* Form Header */}
                    <div className="p-6 border-b border-gray-200 print:p-4">
                        <h2 className="text-2xl font-bold text-center mb-6 print:text-xl">GESTION DE PRESENCE</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm print:text-xs">
                            <div className="flex gap-2">
                                <span className="font-semibold">MOIS:</span>
                                <span className="border-b border-dotted border-gray-400 flex-1">{monthName}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="font-semibold">PROFESSEUR:</span>
                                <span className="border-b border-dotted border-gray-400 flex-1">{selectedGroup.teacherName || '.....................'}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="font-semibold">MATIERE:</span>
                                <span className="border-b border-dotted border-gray-400 flex-1">{selectedGroup.subject}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="font-semibold">SALLE:</span>
                                <span className="border-b border-dotted border-gray-400 flex-1">{selectedGroup.room || '.....................'}</span>
                            </div>
                            <div className="flex gap-2 col-span-2">
                                <span className="font-semibold">GROUPE:</span>
                                <span className="border-b border-dotted border-gray-400 flex-1">{selectedGroup.name}</span>
                            </div>
                        </div>
                    </div>

                    {/* Attendance Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm print:text-xs">
                            <thead>
                                <tr className="border-b-2 border-gray-300">
                                    <th className="border border-gray-300 px-4 py-2 bg-gray-50 font-bold text-left sticky left-0 z-10 print:px-2 print:py-1">
                                        NOMS
                                    </th>
                                    {['SEMAINE1', 'SEMAINE2', 'SEMAINE3', 'SEMAINE4', 'SEMAINE5'].map((week, idx) => (
                                        <th key={week} colSpan={2} className="border border-gray-300 px-2 py-2 bg-gray-50 font-bold text-center print:px-1 print:py-1">
                                            {week}
                                        </th>
                                    ))}
                                    <th className="border border-gray-300 px-4 py-2 bg-gray-50 font-bold text-center print:px-2 print:py-1">
                                        OBSERVATION
                                    </th>
                                </tr>
                                <tr className="border-b border-gray-300">
                                    <th className="border border-gray-300 px-4 py-2 bg-gray-50 sticky left-0 z-10"></th>
                                    {[1, 2, 3, 4, 5].map(week => (
                                        <>
                                            <th key={`${week}-s1`} className="border border-gray-300 px-2 py-1 bg-gray-50 text-center text-xs print:px-1">S1</th>
                                            <th key={`${week}-s2`} className="border border-gray-300 px-2 py-1 bg-gray-50 text-center text-xs print:px-1">S2</th>
                                        </>
                                    ))}
                                    <th className="border border-gray-300 px-2 py-1 bg-gray-50"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupStudents.map((student, idx) => (
                                    <tr key={student.id} className="hover:bg-gray-50">
                                        <td className="border border-gray-300 px-4 py-2 font-medium sticky left-0 bg-white z-10 print:px-2 print:py-1">
                                            {idx + 1}. {student.name} {student.surname}
                                        </td>
                                        {(['week1', 'week2', 'week3', 'week4', 'week5'] as const).map(week => (
                                            <>
                                                <td key={`${week}-s1`} className="border border-gray-300 p-0 text-center">
                                                    <button
                                                        onClick={() => toggleAttendance(student.id, week, 's1')}
                                                        className={`w-full h-full px-2 py-3 print:py-2 transition-colors ${attendance[student.id]?.[week]?.s1
                                                            ? 'bg-green-100 hover:bg-green-200'
                                                            : 'bg-red-50 hover:bg-red-100'
                                                            }`}
                                                    >
                                                        {attendance[student.id]?.[week]?.s1 ? '✓' : '✗'}
                                                    </button>
                                                </td>
                                                <td key={`${week}-s2`} className="border border-gray-300 p-0 text-center">
                                                    <button
                                                        onClick={() => toggleAttendance(student.id, week, 's2')}
                                                        className={`w-full h-full px-2 py-3 print:py-2 transition-colors ${attendance[student.id]?.[week]?.s2
                                                            ? 'bg-green-100 hover:bg-green-200'
                                                            : 'bg-red-50 hover:bg-red-100'
                                                            }`}
                                                    >
                                                        {attendance[student.id]?.[week]?.s2 ? '✓' : '✗'}
                                                    </button>
                                                </td>
                                            </>
                                        ))}
                                        <td className="border border-gray-300 p-1">
                                            <input
                                                type="text"
                                                value={attendance[student.id]?.observation || ''}
                                                onChange={(e) => updateObservation(student.id, e.target.value)}
                                                className="w-full px-2 py-1 border-0 focus:ring-1 focus:ring-blue-500 rounded print:text-xs"
                                                placeholder="..."
                                            />
                                        </td>
                                    </tr>
                                ))}
                                {groupStudents.length === 0 && (
                                    <tr>
                                        <td colSpan={12} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                                            Aucun étudiant dans ce groupe
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center print:hidden">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Sélectionnez un groupe</h3>
                    <p className="text-gray-500 mt-2">
                        Choisissez un groupe pour gérer la présence mensuelle
                    </p>
                </div>
            )}

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 10mm;
                    }
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    table {
                        page-break-inside: avoid;
                    }
                }
            `}</style>
        </div>
    );
}
