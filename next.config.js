/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enables static HTML export
  reactStrictMode: true,
  
  // Optional: Add a basePath for GitHub Pages if your project is hosted at a subpath
  // e.g., if your repo is 'my-username/my-repo', set basePath: '/my-repo'
  // If hosted at 'my-username.github.io', you can omit basePath or set it to '/'
  // IMPORTANT: Replace '<YOUR_REPO_NAME>' with your actual GitHub repository name if applicable.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '', 

  images: {
    unoptimized: true, // Required for static export as next/image optimization needs a server
  },
};

module.exports = nextConfig;