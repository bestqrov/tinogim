'use client';

import { useState } from 'react';
import {
    DollarSign,
    Save,
    BookOpen,
    GraduationCap,
    Edit2,
    Check,
    X
} from 'lucide-react';
import Button from '@/components/Button';

interface PriceItem {
    id: string;
    niveau: string;
    matiere: string;
    volumeHoraire: string;
    category: 'soutien' | 'formation';
}

export default function PrixPage() {
    // editing state removed

    // Soutien Scolaire pricing data
    const [prices, setPrices] = useState<PriceItem[]>([
        // LYCÉE
        { id: 'lycee_maths', niveau: 'LYCÉE', matiere: 'MATHS', volumeHoraire: '2 S – 1H30 MIN x2', category: 'soutien' },
        { id: 'lycee_physique', niveau: 'LYCÉE', matiere: 'PHYSIQUE + CHIM', volumeHoraire: '1 S — 2H00 MIN x2', category: 'soutien' },
        { id: 'lycee_svt', niveau: 'LYCÉE', matiere: 'S.V.T', volumeHoraire: '1 S — 2H00 MIN x2', category: 'soutien' },
        { id: 'lycee_anglais', niveau: 'LYCÉE', matiere: 'ANGLAIS', volumeHoraire: '1 S — 1H30 MIN x2', category: 'soutien' },
        { id: 'lycee_francais', niveau: 'LYCÉE', matiere: 'FRANÇAIS', volumeHoraire: '2 S --- 1H30 MIN x2', category: 'soutien' },
        { id: 'lycee_1bac_maths', niveau: '1ère BAC', matiere: 'S.MATHS – MATHS', volumeHoraire: '2 S – 1H30 MIN x2', category: 'soutien' },

        // COLLÈGE
        { id: 'college_maths', niveau: 'COLLÈGE', matiere: 'MATHS', volumeHoraire: '2 S – 1H30 MIN x2', category: 'soutien' },
        { id: 'college_physique', niveau: 'COLLÈGE', matiere: 'PHYSIQUE + CHIM', volumeHoraire: '1 S — 2H00 MIN', category: 'soutien' },
        { id: 'college_svt', niveau: 'COLLÈGE', matiere: 'S.V.T', volumeHoraire: '1 S — 2H00 MIN', category: 'soutien' },
        { id: 'college_anglais', niveau: 'COLLÈGE', matiere: 'ANGLAIS', volumeHoraire: '1 S — 2H00 MIN x2', category: 'soutien' },

        // PRIMAIRE - CP-CE1-CE2-CM1-CM2-6ème
        { id: 'primaire_all_maths', niveau: 'PRIMAIRE (CP-CE1-CE2-CM1-CM2-6ème)', matiere: 'MATHS', volumeHoraire: '2 S --- 2H00 MIN x2', category: 'soutien' },
        { id: 'primaire_all_arabe', niveau: 'PRIMAIRE (CP-CE1-CE2-CM1-CM2-6ème)', matiere: 'ARABE', volumeHoraire: '2 S --- 2H00 MIN x2', category: 'soutien' },
        { id: 'primaire_all_francais', niveau: 'PRIMAIRE (CP-CE1-CE2-CM1-CM2-6ème)', matiere: 'FRANÇAIS', volumeHoraire: '2 S --- 2H00 MIN x2', category: 'soutien' },

        // PRIMAIRE - CP-CE1-CE2 Communication
        { id: 'primaire_cp_francais', niveau: 'PRIMAIRE (CP-CE1-CE2)', matiere: 'FRANÇAIS COMMUNICATION', volumeHoraire: '1 S --- 1H30 MIN x2', category: 'soutien' },

        // PRIMAIRE - CM1-CM2-6ème Communication
        { id: 'primaire_cm_francais', niveau: 'PRIMAIRE (CM1-CM2-6ème)', matiere: 'FRANÇAIS COMMUNICATION', volumeHoraire: '1 S --- 1H30 MIN x2', category: 'soutien' },

        // DIVERS
        { id: 'calcul_mental', niveau: 'DIVERS', matiere: 'CALCUL MENTAL', volumeHoraire: '1 S — 2H00 MIN', category: 'soutien' },

        // Formations Professionnelles
        { id: 'coiffure', niveau: 'FORMATION', matiere: 'Coiffure', volumeHoraire: 'Formation complète', category: 'formation' },
        { id: 'bureautique', niveau: 'FORMATION', matiere: 'Bureautique', volumeHoraire: 'Formation complète', category: 'formation' },
        { id: 'ecommerce', niveau: 'FORMATION', matiere: 'E-commerce', volumeHoraire: 'Formation complète', category: 'formation' },
    ]);

    // Editing state removed as prices are no longer managed here

    const soutienPrices = prices.filter(p => p.category === 'soutien');
    const formationPrices = prices.filter(p => p.category === 'formation');

    // Group by niveau
    const groupedSoutien = soutienPrices.reduce((acc, item) => {
        if (!acc[item.niveau]) {
            acc[item.niveau] = [];
        }
        acc[item.niveau].push(item);
        return acc;
    }, {} as Record<string, PriceItem[]>);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Gestion des Prix</h1>
                    <p className="text-gray-600 mt-1">Configurez les tarifs pour les cours et formations</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                    <DollarSign className="text-green-600" size={32} />
                </div>
            </div>

            {/* Soutien Scolaire */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-purple-100 p-2 rounded-lg">
                        <BookOpen className="text-purple-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Soutien Scolaire</h2>
                        <p className="text-sm text-gray-500">Prix par niveau et matière</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gradient-to-r from-purple-100 to-purple-50 border-b-2 border-purple-200">
                                <th className="text-left py-3 px-4 font-bold text-gray-700 border border-gray-200">NIVEAU</th>
                                <th className="text-left py-3 px-4 font-bold text-gray-700 border border-gray-200">MATIÈRE</th>
                                <th className="text-left py-3 px-4 font-bold text-gray-700 border border-gray-200">VOL. HORAIRE</th>
                                <th className="text-right py-3 px-4 font-bold text-gray-700 border border-gray-200">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(groupedSoutien).map(([niveau, items]) => (
                                items.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-purple-50 transition-colors border-b border-gray-100">
                                        {index === 0 && (
                                            <td
                                                rowSpan={items.length}
                                                className="py-4 px-4 font-bold text-purple-700 bg-purple-50 border border-gray-200 align-top"
                                            >
                                                {niveau}
                                            </td>
                                        )}
                                        <td className="py-4 px-4 font-medium text-gray-800 border border-gray-200">{item.matiere}</td>
                                        <td className="py-4 px-4 text-sm text-gray-600 border border-gray-200">{item.volumeHoraire}</td>
                                        <td className="py-4 px-4 text-right border border-gray-200">
                                            {/* Actions cell content removed or simplified since editing price is no longer needed here */}
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {/* Maybe specific action or just display only */ }}
                                                    className="p-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                                                    disabled
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Formations Professionnelles */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-orange-100 p-2 rounded-lg">
                        <GraduationCap className="text-orange-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Formations Professionnelles</h2>
                        <p className="text-sm text-gray-500">Prix par formation (complète)</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gradient-to-r from-orange-100 to-orange-50 border-b-2 border-orange-200">
                                <th className="text-left py-3 px-4 font-bold text-gray-700 border border-gray-200">FORMATION</th>
                                <th className="text-left py-3 px-4 font-bold text-gray-700 border border-gray-200">DURÉE</th>
                                <th className="text-right py-3 px-4 font-bold text-gray-700 border border-gray-200">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formationPrices.map((item) => (
                                <tr key={item.id} className="hover:bg-orange-50 transition-colors border-b border-gray-100">
                                    <td className="py-4 px-4 font-medium text-gray-800 border border-gray-200">{item.matiere}</td>
                                    <td className="py-4 px-4 text-sm text-gray-600 border border-gray-200">{item.volumeHoraire}</td>
                                    <td className="py-4 px-4 text-right border border-gray-200">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                className="p-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                                                disabled
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Inscription Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 mt-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-100 p-2 rounded-lg">
                        <DollarSign className="text-blue-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Inscription</h2>
                        <p className="text-sm text-gray-500">Informations sur les frais d'inscription aux formations</p>
                    </div>
                </div>
                <p className="text-gray-700">Cette section pourra contenir les détails des frais d'inscription aux différentes formations professionnelles.</p>
            </div>

            {/* Nouvelle Formations Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 mt-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-orange-100 p-2 rounded-lg">
                        <GraduationCap className="text-orange-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Nouvelle Formations</h2>
                        <p className="text-sm text-gray-500">Ajoutez et gérez les nouvelles formations professionnelles</p>
                    </div>
                </div>
                <p className="text-gray-700">Utilisez cette zone pour créer de nouvelles formations et définir leurs prix.</p>
            </div>

            {/* Save All Button */}
            <div className="flex justify-end">
                <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3">
                    <Save size={20} />
                    Enregistrer toutes les modifications
                </Button>
            </div>
        </div>
    );
}
