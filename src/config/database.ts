import { PrismaClient } from '@prisma/client';

// Fix DATABASE_URL if database name is missing (e.g., ".mongodb.net/?appName=..." → ".mongodb.net/enova?appName=...")
function getFixedDatabaseUrl(): string | undefined {
    const url = process.env.DATABASE_URL;
    if (!url) return url;

    try {
        // Check if the path segment between the host and query string is empty
        // Pattern: mongodb+srv://...@host.net/?... → should be ...@host.net/enova?...
        const fixed = url.replace(
            /(mongodb(?:\+srv)?:\/\/[^@]+@[^/]+)\/?(\?)/,
            '$1/enova$2'
        );
        if (fixed !== url) {
            console.log('⚠️  DATABASE_URL was missing database name — auto-fixed to include /enova');
            process.env.DATABASE_URL = fixed;
        }
        return fixed;
    } catch {
        return url;
    }
}

getFixedDatabaseUrl();

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

export default prisma;
