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
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
}

module.exports = nextConfig
