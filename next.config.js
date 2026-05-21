/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enables static HTML export
  reactStrictMode: true,
  
  // The basePath will be automatically injected by the GitHub Pages action (actions/configure-pages@v5)
  // based on your repository name.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '', 

  images: {
    unoptimized: true, // Required for static export as next/image optimization needs a server
  },
};

module.exports = nextConfig;