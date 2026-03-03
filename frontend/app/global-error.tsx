'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Auto-reload on chunk load errors
        if (
            error.name === 'ChunkLoadError' ||
            error.message?.includes('Loading chunk') ||
            error.message?.includes('Failed to fetch dynamically imported module')
        ) {
            window.location.reload();
        }
    }, [error]);

    return (
        <html>
            <body style={{ fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0, backgroundColor: '#f9fafb' }}>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <h2 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>Une erreur est survenue</h2>
                    <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>La page va se recharger automatiquement...</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ padding: '0.5rem 1.5rem', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Recharger
                    </button>
                </div>
            </body>
        </html>
    );
}
