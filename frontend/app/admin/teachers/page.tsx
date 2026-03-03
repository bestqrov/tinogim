'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Button from '@/components/Button';
import {
    PlusCircle,
    Edit,
    Trash2,
    Search,
    User,
    Mail,
    Phone,
    BookOpen,
    GraduationCap,
    Clock,
    Palette,
    Scissors,
    Monitor,
    Calculator,
    Briefcase,
    DollarSign,
    Percent,
    LayoutDashboard,
    Key,
    ShieldCheck,
    ShieldOff,
    Loader2,
    Eye,
    EyeOff,
    X
} from 'lucide-react';
import { teachersService } from '@/lib/services/teachers';
import { formationsService } from '@/lib/services/formations';
import { Teacher } from '@/types';

// Use global Teacher interface from @/types


const NIVEAUX_SCOLAIRE = [
    { key: 'primaire', nameKey: 'Primaire' },
    { key: 'college', nameKey: 'Collège' },
    { key: 'lycee', nameKey: 'Lycée' },
    { key: 'formation', nameKey: 'Formation Pro' }
];

const GENERAL_SUBJECTS = [
    'Mathématiques', 'Physique', 'Chimie', 'SVT',
    'Français', 'Anglais', 'Arabe', 'Histoire-Géo',
    'Philosophie', 'Informatique'
];

const PAYMENT_TYPES = [
    { key: 'HOURLY', label: 'Par Heure' },
    { key: 'FIXED', label: 'Salaire Fixe (Global)' },
    { key: 'PERCENTAGE', label: '% par Inscription' }
];

const TeachersContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const type = searchParams.get('type') as 'FORMATION' | 'SOUTIEN' | null;
    const isFormationMode = type === 'FORMATION';

    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [formations, setFormations] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Password management state
    const [loginEnabledCount, setLoginEnabledCount] = useState(0);
    const [passwordModalTeacher, setPasswordModalTeacher] = useState<Teacher | null>(null);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [disableLoading, setDisableLoading] = useState<Record<string, boolean>>({});

    const initialFormData = {
        name: '',
        email: '',
        phone: '',
        cin: '',
        gender: 'Male',
        status: 'Active' as 'Active' | 'Inactive',
        socialMedia: {
            linkedin: '',
            twitter: '',
            facebook: '',
            whatsapp: ''
        },
        hourlyRate: 0,
        paymentType: 'HOURLY' as 'HOURLY' | 'FIXED' | 'PERCENTAGE',
        commission: 0,
        specialties: [] as string[],
        levels: [] as string[]
    };
    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        fetchTeachers();
        fetchLoginEnabledCount();
        if (isFormationMode) {
            fetchFormations();
        }
    }, [isFormationMode]);

    const fetchLoginEnabledCount = async () => {
        try {
            const data = await teachersService.getLoginEnabledCount();
            setLoginEnabledCount(data.count);
        } catch { /* silent */ }
    };

    const fetchTeachers = async () => {
        try {
            setLoading(true);
            const data = await teachersService.getAll();
            setTeachers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFormations = async () => {
        try {
            const data = await formationsService.getAll();
            // Assuming data is array or wrapped object as handled before
            const list = Array.isArray(data) ? data : (data as any).data || [];
            // Extract unique formation names for specialties list
            setFormations(list.map((f: any) => f.name));
        } catch (error) {
            console.error('Failed to load formations', error);
        }
    };

    const handleOpenModal = (teacher: Teacher | null) => {
        setEditingTeacher(teacher);
        if (teacher) {
            setFormData({
                name: teacher.name,
                email: teacher.email || '',
                phone: teacher.phone || '',
                cin: teacher.cin || '',
                gender: teacher.gender || 'Male',
                status: teacher.status || 'Active',
                socialMedia: {
                    linkedin: teacher.socialMedia?.linkedin || '',
                    twitter: teacher.socialMedia?.twitter || '',
                    facebook: teacher.socialMedia?.facebook || '',
                    whatsapp: teacher.socialMedia?.whatsapp || ''
                },
                hourlyRate: teacher.hourlyRate || 0,
                paymentType: (teacher.paymentType as any) || 'HOURLY',
                commission: teacher.commission || 0,
                specialties: teacher.specialties || [],
                levels: teacher.levels || []
            });
        } else {
            setFormData(initialFormData);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTeacher) {
                await teachersService.update(editingTeacher.id, formData);
            } else {
                await teachersService.create(formData);
            }
            fetchTeachers();
            setIsModalOpen(false);
        } catch (error) {
            alert('Erreur lors de l\'enregistrement');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Supprimer ce professeur ?')) {
            try {
                await teachersService.delete(id);
                fetchTeachers();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const toggleSelection = (field: 'specialties' | 'levels', value: string) => {
        setFormData(prev => {
            const current = prev[field];
            const updated = current.includes(value)
                ? current.filter(item => item !== value)
                : [...current, value];
            return { ...prev, [field]: updated };
        });
    };

    const openPasswordModal = (teacher: Teacher) => {
        setPasswordModalTeacher(teacher);
        setPasswordInput('');
        setPasswordConfirm('');
        setPasswordError('');
        setShowPassword(false);
    };

    const closePasswordModal = () => {
        setPasswordModalTeacher(null);
        setPasswordInput('');
        setPasswordConfirm('');
        setPasswordError('');
    };

    const handleSetTeacherPassword = async () => {
        if (!passwordModalTeacher) return;
        if (passwordInput.length < 6) {
            setPasswordError('Le mot de passe doit comporter au moins 6 caractères.');
            return;
        }
        if (passwordInput !== passwordConfirm) {
            setPasswordError('Les mots de passe ne correspondent pas.');
            return;
        }
        setPasswordLoading(true);
        setPasswordError('');
        try {
            await teachersService.setPassword(passwordModalTeacher.id, passwordInput);
            setTeachers(prev => prev.map(t => t.id === passwordModalTeacher.id ? { ...t, loginEnabled: true } : t));
            fetchLoginEnabledCount();
            closePasswordModal();
        } catch (err: any) {
            setPasswordError(err.response?.data?.error || err.message || 'Erreur');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleDisableTeacherLogin = async (teacherId: string) => {
        if (!confirm('Désactiver le compte de connexion de ce formateur ?')) return;
        setDisableLoading(prev => ({ ...prev, [teacherId]: true }));
        try {
            await teachersService.disableLogin(teacherId);
            setTeachers(prev => prev.map(t => t.id === teacherId ? { ...t, loginEnabled: false } : t));
            fetchLoginEnabledCount();
        } catch (err: any) {
            alert(err.response?.data?.error || err.message || 'Erreur');
        } finally {
            setDisableLoading(prev => ({ ...prev, [teacherId]: false }));
        }
    };

    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Dynamic Design Config
    const headerGradient = isFormationMode
        ? 'from-blue-600 via-indigo-600 to-purple-600'
        : 'from-amber-500 to-orange-500';

    const buttonClass = isFormationMode
        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/20'
        : 'bg-amber-600 text-white shadow-lg shadow-amber-600/20';

    const subjectsList = isFormationMode ? formations : GENERAL_SUBJECTS;

    const getSubjectIcon = (subject: string) => {
        if (subject.toLowerCase().includes('coiffure')) return <Scissors size={14} />;
        if (subject.toLowerCase().includes('infographie')) return <Palette size={14} />;
        if (subject.toLowerCase().includes('bureautique')) return <Monitor size={14} />;
        if (subject.toLowerCase().includes('compta')) return <Calculator size={14} />;
        return <BookOpen size={14} />;
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isFormationMode ? 'Formateurs & Instructeurs' : 'Gestion des Professeurs'}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {isFormationMode ? 'Gérez les experts de vos formations professionnelles' : 'Gérez votre équipe pédagogique'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${loginEnabledCount >= 20 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            <Key size={12} />
                            {loginEnabledCount}/20 comptes actifs
                        </span>
                    </div>
                </div>
                <Button
                    onClick={() => handleOpenModal(null)}
                    className={`${buttonClass} hover:opacity-90 transition-opacity`}
                >
                    <PlusCircle size={18} className="mr-2" />
                    {isFormationMode ? 'Nouveau Formateur' : 'Nouveau Professeur'}
                </Button>
            </div>

            {/* Search */}
            <div className={`p-1 rounded-xl bg-gradient-to-r ${headerGradient} shadow-sm`}>
                <div className="bg-white rounded-lg p-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder={isFormationMode ? "Rechercher un instructeur..." : "Rechercher par nom ou matière..."}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border-none rounded-lg focus:ring-0 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTeachers.map(teacher => (
                    <div key={teacher.id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 overflow-hidden flex flex-col">

                        {/* ── Card Header ── */}
                        <div className="p-4 flex items-center gap-3 min-w-0">
                            {/* Avatar */}
                            <div className={`w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-black text-lg shadow-md bg-gradient-to-br ${['from-pink-500 to-rose-500', 'from-purple-500 to-indigo-500', 'from-cyan-500 to-blue-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500'][teacher.name.length % 5]}`}>
                                {teacher.name.charAt(0)}
                            </div>
                            {/* Name + email */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 text-sm leading-tight truncate group-hover:text-blue-600 transition-colors">{teacher.name}</h3>
                                {teacher.email ? (
                                    <p className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5 min-w-0">
                                        <Mail size={10} className="text-orange-400 flex-shrink-0" />
                                        <span className="truncate">{teacher.email}</span>
                                    </p>
                                ) : (
                                    <p className="text-[11px] text-gray-300 italic mt-0.5">Aucun email</p>
                                )}
                            </div>
                            {/* Edit / Delete */}
                            <div className="flex gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenModal(teacher)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={14} /></button>
                                <button onClick={() => handleDelete(teacher.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                            </div>
                        </div>

                        {/* ── Info row ── */}
                        <div className="px-4 pb-3 flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1 min-w-0">
                                <Phone size={11} className="text-green-500 flex-shrink-0" />
                                <span className="truncate">{teacher.phone || '—'}</span>
                            </span>
                            <span className="flex items-center gap-1 flex-shrink-0">
                                <User size={11} className="text-indigo-400" />
                                {teacher._count?.groups || 0} gr.
                            </span>
                            <span className="ml-auto flex-shrink-0 font-bold text-gray-700 text-xs">
                                {teacher.paymentType === 'PERCENTAGE'
                                    ? `${teacher.commission}%/ins`
                                    : `${teacher.hourlyRate} MAD${teacher.paymentType === 'HOURLY' ? '/h' : ''}`}
                            </span>
                        </div>

                        {/* ── Specialties ── */}
                        {teacher.specialties.length > 0 && (
                            <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                                {teacher.specialties.slice(0, 4).map((s, idx) => (
                                    <span key={s} className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${['bg-blue-50 text-blue-700', 'bg-purple-50 text-purple-700', 'bg-rose-50 text-rose-700', 'bg-amber-50 text-amber-700'][idx % 4]}`}>
                                        {isFormationMode && getSubjectIcon(s)}
                                        {s}
                                    </span>
                                ))}
                                {teacher.specialties.length > 4 && (
                                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-500">+{teacher.specialties.length - 4}</span>
                                )}
                            </div>
                        )}

                        {/* ── Actions ── */}
                        <div className="mt-auto px-4 pb-4 pt-2 border-t border-gray-50 space-y-2">
                            <button
                                onClick={() => router.push(`/admin/teachers/dashboard?id=${teacher.id}`)}
                                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-black font-bold text-xs transition-all shadow-sm shadow-amber-200/50"
                            >
                                <LayoutDashboard size={13} />
                                Tableau de bord
                            </button>

                            {/* Login account */}
                            {teacher.loginEnabled ? (
                                <div className="flex items-center justify-between px-1">
                                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                                        <ShieldCheck size={12} /> Compte actif
                                    </span>
                                    <button
                                        onClick={() => handleDisableTeacherLogin(teacher.id)}
                                        disabled={!!disableLoading[teacher.id]}
                                        className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-600 font-medium transition disabled:opacity-50"
                                    >
                                        {disableLoading[teacher.id] ? <Loader2 size={11} className="animate-spin" /> : <ShieldOff size={11} />}
                                        Désactiver
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => openPasswordModal(teacher)}
                                    disabled={loginEnabledCount >= 20}
                                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-dashed border-slate-200 hover:border-slate-400 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                                >
                                    <Key size={11} />
                                    {loginEnabledCount >= 20 ? 'Limite 20 atteinte' : 'Activer compte connexion'}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Password Activation Modal ── */}
            {passwordModalTeacher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md" onClick={closePasswordModal}>
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-6 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 relative">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Key size={20} />
                                Activer le compte
                            </h2>
                            <p className="text-white/80 text-sm mt-0.5">{passwordModalTeacher.name}</p>
                            <button
                                onClick={closePasswordModal}
                                className="absolute top-4 right-4 text-white/70 hover:text-white transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            {loginEnabledCount >= 20 && (
                                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600 font-medium">
                                    ⚠️ Limite de 20 comptes atteinte. Désactivez un autre compte pour continuer.
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email utilisé</label>
                                <div className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500">
                                    {passwordModalTeacher.email || <span className="italic text-slate-400">Aucun email renseigné</span>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mot de passe *</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={passwordInput}
                                        onChange={e => setPasswordInput(e.target.value)}
                                        placeholder="Minimum 6 caractères"
                                        className="w-full px-4 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
                                        autoFocus
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

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirmer le mot de passe *</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={passwordConfirm}
                                    onChange={e => setPasswordConfirm(e.target.value)}
                                    placeholder="Répétez le mot de passe"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
                                    onKeyDown={e => e.key === 'Enter' && handleSetTeacherPassword()}
                                />
                            </div>

                            {passwordError && (
                                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{passwordError}</p>
                            )}

                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={closePasswordModal}
                                    className="flex-1 py-2.5 text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSetTeacherPassword}
                                    disabled={passwordLoading || loginEnabledCount >= 20 || !passwordInput}
                                    className="flex-1 py-2.5 text-sm bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
                                >
                                    {passwordLoading ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                                    {passwordLoading ? 'Activation...' : 'Activer'}
                                </button>
                            </div>

                            <p className="text-center text-xs text-slate-400">
                                {loginEnabledCount}/20 comptes actifs
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className={`px-6 py-5 bg-gradient-to-r ${headerGradient}`}>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                {isFormationMode ? <Briefcase className="text-white/80" /> : <User className="text-white/80" />}
                                {editingTeacher ? 'Modifier le Formateur' : 'Nouveau Formateur'}
                            </h2>
                            <p className="text-white/80 text-sm mt-1">
                                {isFormationMode ? 'Information professionnelle et spécialités' : 'Détails du professeur'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="label font-bold text-blue-700 dark:text-yellow-400">Nom Complet *</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            required
                                            type="text"
                                            className="input pl-10"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Ex: Ahmed Bennani"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1 ml-1">Nom complet tel qu'il apparaîtra sur les contrats</p>
                                </div>

                                <div>
                                    <label className="label font-bold text-blue-700 dark:text-yellow-400">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input type="email" className="input pl-10" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="label font-bold text-blue-700 dark:text-yellow-400">Téléphone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input type="tel" className="input pl-10" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                </div>

                                <div>
                                    <label className="label font-bold text-blue-700 dark:text-yellow-400">CIN</label>
                                    <input type="text" className="input" value={formData.cin} onChange={e => setFormData({ ...formData, cin: e.target.value })} placeholder="Numéro CIN" />
                                </div>

                                <div>
                                    <label className="label font-bold text-blue-700 dark:text-yellow-400">Genre</label>
                                    <select className="input" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                        <option value="Male">Homme</option>
                                        <option value="Female">Femme</option>
                                    </select>
                                </div>

                                <div className="col-span-2 bg-gray-50/50 p-4 rounded-xl border border-dashed border-gray-200">
                                    <h3 className="text-sm font-bold text-blue-700 dark:text-yellow-400 mb-4 flex items-center gap-2">
                                        🌐 Réseaux Sociaux & Contact
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">WhatsApp</label>
                                            <input type="text" className="input py-1.5" value={formData.socialMedia.whatsapp} onChange={e => setFormData({ ...formData, socialMedia: { ...formData.socialMedia, whatsapp: e.target.value } })} placeholder="Numéro" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Facebook</label>
                                            <input type="text" className="input py-1.5" value={formData.socialMedia.facebook} onChange={e => setFormData({ ...formData, socialMedia: { ...formData.socialMedia, facebook: e.target.value } })} placeholder="Pseudo/Lien" />
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <h3 className="text-sm font-bold text-blue-700 dark:text-yellow-400 mb-3 flex items-center gap-2">
                                        <DollarSign size={16} /> Information Financière
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="label text-xs uppercase tracking-wide text-gray-500">Type de Paiement</label>
                                            <select
                                                className="input"
                                                value={formData.paymentType}
                                                onChange={e => setFormData({ ...formData, paymentType: e.target.value as any })}
                                            >
                                                {PAYMENT_TYPES.map(t => (
                                                    <option key={t.key} value={t.key}>{t.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {formData.paymentType === 'PERCENTAGE' ? (
                                            <div>
                                                <label className="label text-xs uppercase tracking-wide text-gray-500">Commission (%)</label>
                                                <div className="relative">
                                                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                    <input
                                                        type="number"
                                                        className="input pl-10"
                                                        value={formData.commission}
                                                        onChange={e => setFormData({ ...formData, commission: parseFloat(e.target.value) })}
                                                        placeholder="Ex: 30"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1">Pourcentage par inscription</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="label text-xs uppercase tracking-wide text-gray-500">
                                                    {formData.paymentType === 'HOURLY' ? 'Taux Horaire (MAD/h)' : 'Salaire Fixe (MAD)'}
                                                </label>
                                                <div className="relative">
                                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                    <input
                                                        type="number"
                                                        className="input pl-10"
                                                        value={formData.hourlyRate}
                                                        onChange={e => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="col-span-2">
                                    <label className="label font-bold text-blue-700 dark:text-yellow-400 mb-3 block flex items-center gap-2">
                                        <BookOpen size={16} className={isFormationMode ? "text-indigo-500" : "text-amber-500"} />
                                        {isFormationMode ? 'Compétences (Formations)' : 'Matières enseignées'}
                                    </label>

                                    {isFormationMode && subjectsList.length === 0 ? (
                                        <div className="p-4 bg-orange-50 text-orange-600 rounded-lg text-sm mb-2">
                                            Aucune formation trouvée. Veuillez d'abord créer des formations.
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-xl border border-gray-100 max-h-40 overflow-y-auto">
                                            {subjectsList.map(s => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => toggleSelection('specialties', s)}
                                                    className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 ${formData.specialties.includes(s)
                                                        ? isFormationMode
                                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 transform scale-105'
                                                            : 'bg-amber-100 text-amber-700 border-amber-200'
                                                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {isFormationMode && getSubjectIcon(s)}
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {!isFormationMode && (
                                    <div className="col-span-2">
                                        <label className="label font-bold text-blue-700 dark:text-yellow-400 mb-2 block">Niveaux</label>
                                        <div className="flex flex-wrap gap-2">
                                            {NIVEAUX_SCOLAIRE.map(n => (
                                                <button
                                                    key={n.key}
                                                    type="button"
                                                    onClick={() => toggleSelection('levels', n.key)}
                                                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${formData.levels.includes(n.key)
                                                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {n.nameKey}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                                <Button type="button" onClick={() => setIsModalOpen(false)} className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">Annuler</Button>
                                <Button type="submit" className={`${buttonClass}`}>Enregistrer</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .label { @apply block text-sm font-medium text-gray-700 mb-1; }
                .input { @apply w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all; }
            `}</style>
        </div>
    );
};

export default function TeachersPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <TeachersContent />
        </Suspense>
    );
}
