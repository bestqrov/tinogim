import type { Metadata } from 'next';
// import { Inter } from 'next/font/google';
import './globals.css';

// const inter = Inter({ subsets: ['latin'] });
const inter = { className: 'font-sans' };

export const metadata: Metadata = {
    title: 'ArwaEduc',
    description: 'Système de gestion scolaire',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr">
            <head>
                <script dangerouslySetInnerHTML={{ __html: `
                    window.addEventListener('error', function(e) {
                        if (e.message && (e.message.includes('Loading chunk') || e.message.includes('ChunkLoadError') || e.message.includes('Failed to fetch dynamically imported module'))) {
                            var key = 'chunk_reload_' + Date.now();
                            if (!sessionStorage.getItem('chunk_reloaded')) {
                                sessionStorage.setItem('chunk_reloaded', '1');
                                window.location.reload();
                            }
                        }
                    });
                    window.addEventListener('unhandledrejection', function(e) {
                        if (e.reason && e.reason.name === 'ChunkLoadError') {
                            if (!sessionStorage.getItem('chunk_reloaded')) {
                                sessionStorage.setItem('chunk_reloaded', '1');
                                window.location.reload();
                            }
                        }
                    });
                    // Clear the reload flag after 5s so future errors can also reload
                    setTimeout(function() { sessionStorage.removeItem('chunk_reloaded'); }, 5000);
                ` }} />
            </head>
            <body className={inter.className}>{children}</body>
        </html>
    );
}
