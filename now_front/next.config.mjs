/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api-now/:path*',
        destination: 'http://127.0.0.1:8081/:path*',
      },
    ];
  },
};

export default nextConfig;
