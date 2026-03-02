import React from 'react';

interface ReceiptItem {
    description: string;
    amount: number;
}

interface ThermalReceiptProps {
    schoolName?: string;
    address?: string;
    phone?: string;
    logo?: string | null;
    receiptNumber: string;
    date: string;
    time?: string;
    issuedTo: string;
    phoneNumber?: string;
    receiptType?: string;
    paymentMethod?: string;
    checkNumber?: string;
    items: ReceiptItem[];
    totalAmount: number;
    amountPaid: number;
    notes?: string;
}

export default function ThermalReceipt({
    schoolName    = 'ARWA EDUC',
    address       = 'Maroc',
    phone         = '',
    logo,
    receiptNumber,
    date,
    time,
    issuedTo,
    phoneNumber,
    receiptType   = 'Soutien',
    paymentMethod = 'Cash',
    checkNumber,
    items,
    totalAmount,
    amountPaid,
    notes,
}: ThermalReceiptProps) {
    const remaining     = totalAmount - amountPaid;
    const formattedDate = new Date(date).toLocaleDateString('fr-FR');

    return (
        <div style={{
            width: 300,
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: 12,
            color: '#111',
            background: '#fff',
            padding: '16px 12px',
            lineHeight: 1.6,
            letterSpacing: 0.3,
        }}>
            {/* ── HEADER ── */}
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
                {logo && (
                    <img src={logo} alt="logo"
                        style={{ width: 56, height: 56, objectFit: 'contain', marginBottom: 4 }} />
                )}
                <div style={{ fontWeight: 900, fontSize: 15, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    {schoolName}
                </div>
                {address && <div style={{ fontSize: 10, marginTop: 2 }}>{address}</div>}
                {phone    && <div style={{ fontSize: 10 }}>Tél : {phone}</div>}
            </div>

            {/* ── TITLE ── */}
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>
                ★  REÇU DE {receiptType.toUpperCase()}  ★
            </div>

            <div style={{ borderTop: '2px solid #000', margin: '8px 0' }} />

            {/* ── RECEIPT META ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span>Date : <strong>{formattedDate}</strong></span>
                {time && <span>Heure : <strong>{time}</strong></span>}
            </div>
            <div style={{ fontSize: 11, marginBottom: 6 }}>
                Reçu No : <strong>{receiptNumber}</strong>
            </div>

            <div style={{ borderTop: '1px dashed #555', margin: '6px 0' }} />

            {/* ── CLIENT INFO ── */}
            <div style={{ fontSize: 11, marginBottom: 6 }}>
                <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: 10, marginBottom: 3, letterSpacing: 1 }}>
                    ▸ INFORMATIONS CLIENT
                </div>
                <div>Nom      : <strong>{issuedTo}</strong></div>
                {phoneNumber && <div>Tél      : {phoneNumber}</div>}
                <div>Paiement : <strong>{paymentMethod === 'Cash' ? 'Espèces' : 'Chèque'}</strong></div>
                {paymentMethod === 'Check' && checkNumber && (
                    <div>Chèque No: <strong>{checkNumber}</strong></div>
                )}
            </div>

            <div style={{ borderTop: '1px dashed #555', margin: '6px 0' }} />

            {/* ── ITEMS TABLE ── */}
            <div style={{ fontSize: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
                    <span>DÉSIGNATION</span>
                    <span>MONTANT</span>
                </div>
                <div style={{ borderTop: '1px solid #000', marginBottom: 4 }} />
                {items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ maxWidth: 185, wordBreak: 'break-word' }}>{item.description || '—'}</span>
                        <span style={{ whiteSpace: 'nowrap', marginLeft: 8 }}>{item.amount.toFixed(2)} MAD</span>
                    </div>
                ))}
            </div>

            <div style={{ borderTop: '2px solid #000', margin: '6px 0' }} />

            {/* ── TOTALS ── */}
            <div style={{ fontSize: 11, marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span>Sous-total</span>
                    <span>{totalAmount.toFixed(2)} MAD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span>Montant payé</span>
                    <span><strong>{amountPaid.toFixed(2)} MAD</strong></span>
                </div>
                <div style={{ borderTop: '1px dashed #555', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 13 }}>
                    <span>RESTE DÛ</span>
                    <span style={{ color: remaining > 0 ? '#b91c1c' : '#15803d' }}>
                        {remaining.toFixed(2)} MAD
                    </span>
                </div>
            </div>

            {/* ── NOTES ── */}
            {notes && (
                <>
                    <div style={{ borderTop: '1px dashed #555', margin: '6px 0' }} />
                    <div style={{ fontSize: 10, fontStyle: 'italic' }}>
                        <strong>Note :</strong> {notes}
                    </div>
                </>
            )}

            {/* ── FOOTER ── */}
            <div style={{ borderTop: '2px solid #000', margin: '10px 0 8px' }} />
            <div style={{ textAlign: 'center', fontSize: 10 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 2 }}>
                    شكراً لثقتكم — Merci de votre confiance
                </div>
                <div style={{ letterSpacing: 0.5 }}>{schoolName}</div>
                <div style={{ marginTop: 6, fontSize: 9, color: '#555' }}>
                    — Document généré le {new Date().toLocaleDateString('fr-FR')} —
                </div>
            </div>
        </div>
    );
}
