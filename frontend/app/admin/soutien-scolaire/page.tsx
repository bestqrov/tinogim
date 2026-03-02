'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    TrendingUp,
    Users,
    BookOpen,
    DollarSign,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    GraduationCap,
    AlertCircle,
    Search,
    Phone,
    ChevronRight
} from 'lucide-react';
import { getStudentAnalytics } from '@/lib/services/students';
import api from '@/lib/api';

interface UnpaidStudent {
    id: string;
    name: string;
    surname: string;
    phone?: string;
    schoolLevel?: string;
    totalOwed: number;
    totalPaid: number;
    balance: number;
    lastInscription?: string;
}

export default function SoutienDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalInscriptions: 0,
        totalRevenue: 0,
        recentInscriptions: [] as any[]
    });
    const [unpaidStudents, setUnpaidStudents] = useState<UnpaidStudent[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [analyticsData, studentsRes] = await Promise.all([
                    getStudentAnalytics(),
                    api.get('/documents/students')
                ]);
                setStats(analyticsData);

                // Calculate unpaid students (SOUTIEN only)
                const allStudents = studentsRes.data.data as any[];
                const unpaid: UnpaidStudent[] = allStudents
                    .filter(s => s.inscriptions?.some((i: any) => i.type === 'SOUTIEN'))
                    .map(s => {
                        const soutienInscriptions = s.inscriptions?.filter((i: any) => i.type === 'SOUTIEN') || [];
                        const totalOwed = soutienInscriptions.reduce((sum: number, i: any) => sum + (Number(i.amount) || 0), 0);
                        const totalPaid = s.payments?.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) || 0;
                        const balance = totalOwed - totalPaid;
                        const lastIns = soutienInscriptions[0];
                        return {
                            id: s.id,
                            name: s.name,
                            surname: s.surname,
                            phone: s.phone,
                            schoolLevel: s.schoolLevel,
                            totalOwed,
                            totalPaid,
                            balance,
                            lastInscription: lastIns?.category
                        };
                    })
                    .filter(s => s.balance > 0)
                    .sort((a, b) => b.balance - a.balance);

                setUnpaidStudents(unpaid);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
                    <Icon className={color.replace('bg-', 'text-')} size={24} />
                </div>
                {trend && (
                    <span className={`flex items-center text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trend > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    );

    const filteredUnpaid = unpaidStudents.filter(s =>
        `${s.name} ${s.surname}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone?.includes(searchQuery)
    );

    const totalUnpaidAmount = unpaidStudents.reduce((sum, s) => sum + s.balance, 0);

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500">Chargement des données...</p>
            </div>
        </div>
    );

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Etat de Soutien Scolaire</h1>
                    <p className="text-gray-500 mt-1">Vue d'ensemble de l'activité</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => router.push('/admin/students')}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        Liste Étudiants
                    </button>
                    <button
                        onClick={() => router.push('/admin/students/register')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        + Nouvel Étudiant
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <StatCard
                    title="Total Étudiants"
                    value={stats.totalStudents}
                    icon={GraduationCap}
                    color="bg-blue-500"
                    trend={12}
                />
                <StatCard
                    title="Inscriptions Soutien"
                    value={stats.totalInscriptions}
                    icon={Users}
                    color="bg-purple-500"
                    trend={8}
                />
                <StatCard
                    title="CA Total"
                    value={`${Number(stats.totalRevenue).toLocaleString()} MAD`}
                    icon={DollarSign}
                    color="bg-green-500"
                    trend={24}
                />
                <div className="bg-orange-50 border border-orange-200 p-6 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-orange-100 rounded-xl">
                            <AlertCircle size={20} className="text-orange-600" />
                        </div>
                        <span className="text-sm font-medium text-orange-700">Impayés</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-700">{unpaidStudents.length} élèves</p>
                    <p className="text-sm text-orange-600 font-medium">{totalUnpaidAmount.toLocaleString()} MAD restants</p>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Inscriptions */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Inscriptions Récentes</h3>
                        <button onClick={() => router.push('/admin/finance/recu')} className="text-blue-600 text-sm font-medium hover:underline">Voir tout</button>
                    </div>
                    <div className="space-y-3">
                        {stats.recentInscriptions.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">Aucune inscription récente</p>
                        ) : (
                            stats.recentInscriptions.slice(0, 6).map((inscription: any) => (
                                <div key={inscription.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                                            {inscription.student?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800 text-sm">{inscription.student?.name} {inscription.student?.surname}</p>
                                            <p className="text-xs text-gray-500">{new Date(inscription.createdAt).toLocaleDateString('fr-FR')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-800 text-sm">{Number(inscription.amount).toLocaleString()} MAD</p>
                                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Inscrit</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-lg p-6 text-white">
                    <h3 className="text-lg font-bold mb-4">Actions Rapides</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => router.push('/admin/students/register')} className="p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-left group">
                            <GraduationCap className="mb-3 text-blue-400 group-hover:scale-110 transition-transform" size={22} />
                            <p className="font-medium text-sm">Nouvel Étudiant</p>
                            <p className="text-xs text-gray-400 mt-0.5">Inscrire un élève</p>
                        </button>
                        <button onClick={() => router.push('/admin/students')} className="p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-left group">
                            <Users className="mb-3 text-purple-400 group-hover:scale-110 transition-transform" size={22} />
                            <p className="font-medium text-sm">Liste Étudiants</p>
                            <p className="text-xs text-gray-400 mt-0.5">Voir tous les élèves</p>
                        </button>
                        <button onClick={() => router.push('/admin/groups')} className="p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-left group">
                            <Calendar className="mb-3 text-orange-400 group-hover:scale-110 transition-transform" size={22} />
                            <p className="font-medium text-sm">Planning</p>
                            <p className="text-xs text-gray-400 mt-0.5">Gérer les cours</p>
                        </button>
                        <button onClick={() => router.push('/admin/finance')} className="p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-left group">
                            <TrendingUp className="mb-3 text-green-400 group-hover:scale-110 transition-transform" size={22} />
                            <p className="font-medium text-sm">Rapports</p>
                            <p className="text-xs text-gray-400 mt-0.5">Voir les statistiques</p>
                        </button>
                    </div>
                </div>
            </div>

            {/* Unpaid Students Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-orange-50 rounded-xl">
                            <AlertCircle size={20} className="text-orange-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Élèves Impayés — Soutien Scolaire</h3>
                            <p className="text-sm text-gray-500">
                                {unpaidStudents.length} élève{unpaidStudents.length !== 1 ? 's' : ''} avec solde impayé &bull; Total : <span className="font-semibold text-orange-600">{totalUnpaidAmount.toLocaleString()} MAD</span>
                            </p>
                        </div>
                    </div>
                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher un élève..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {filteredUnpaid.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                                <DollarSign size={28} className="text-green-500" />
                            </div>
                            <p className="font-semibold text-gray-700 text-lg">
                                {searchQuery ? 'Aucun résultat trouvé' : 'Tous les élèves sont à jour !'}
                            </p>
                            <p className="text-gray-400 text-sm mt-1">
                                {searchQuery ? 'Essayez un autre nom' : 'Aucun impayé en soutien scolaire'}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="text-left px-6 py-3">Élève</th>
                                    <th className="text-left px-6 py-3">Niveau</th>
                                    <th className="text-left px-6 py-3">Matière / Groupe</th>
                                    <th className="text-right px-6 py-3">Total Dû</th>
                                    <th className="text-right px-6 py-3">Total Payé</th>
                                    <th className="text-right px-6 py-3">Reste à Payer</th>
                                    <th className="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUnpaid.map((student, idx) => (
                                    <tr
                                        key={student.id}
                                        className="hover:bg-orange-50/40 transition-colors cursor-pointer group"
                                        onClick={() => router.push(`/admin/students`)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                    {student.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-sm">{student.name} {student.surname}</p>
                                                    {student.phone && (
                                                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                            <Phone size={10} /> {student.phone}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                                                {student.schoolLevel || '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {student.lastInscription || '—'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-semibold text-gray-700">{student.totalOwed.toLocaleString()} MAD</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-semibold text-emerald-600">{student.totalPaid.toLocaleString()} MAD</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-100">
                                                {student.balance.toLocaleString()} MAD
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <ChevronRight size={16} className="text-gray-300 group-hover:text-orange-400 transition-colors" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {/* Footer totals */}
                            <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                                <tr>
                                    <td colSpan={3} className="px-6 py-4 text-sm font-bold text-gray-700">
                                        Total ({filteredUnpaid.length} élève{filteredUnpaid.length !== 1 ? 's' : ''})
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-bold text-gray-700">
                                        {filteredUnpaid.reduce((s, e) => s + e.totalOwed, 0).toLocaleString()} MAD
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600">
                                        {filteredUnpaid.reduce((s, e) => s + e.totalPaid, 0).toLocaleString()} MAD
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-bold text-red-700">
                                            {filteredUnpaid.reduce((s, e) => s + e.balance, 0).toLocaleString()} MAD
                                        </span>
                                    </td>
                                    <td className="px-6 py-4"></td>
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
