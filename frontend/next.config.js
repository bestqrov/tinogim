/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    optimizeFonts: false,
    output: 'export',
    distDir: 'dist',
    trailingSlash: true,
    images: {
        unoptimized: true,
        domains: ['localhost'],
    }
}

module.exports = nextConfig
