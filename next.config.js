/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Note: For Tauri, uncomment the next line:
    // output: 'export',
    images: {
        unoptimized: true,
    },
}

module.exports = nextConfig
