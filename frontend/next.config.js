/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    optimizeFonts: false,
    images: {
        unoptimized: true,
        domains: ['localhost'],
    },
    async rewrites() {
        const apiUrl = process.env.NODE_ENV === 'production' 
            ? process.env.NEXT_PUBLIC_API_URL || '/api'
            : 'http://localhost:3000/api';
            
        return [
            {
                source: '/api/:path*',
                destination: `${apiUrl}/:path*`,
            },
        ];
    },
}

module.exports = nextConfig
