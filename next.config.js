/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'lh3.googleusercontent.com',  // For Google profile images
      'avatars.githubusercontent.com'  // For GitHub profile images (if needed)
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  typescript: {
    // Ensure TypeScript errors don't fail the build in production
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ensure ESLint errors don't fail the build in production
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
