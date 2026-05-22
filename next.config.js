/** @type {import('next').NextConfig} */

// GITHUB_REPOSITORY is always "owner/repo" inside GitHub Actions.
// Deriving basePath from it is more reliable than depending on
// configure-pages@v5 outputting base_path correctly.
const repo = (process.env.GITHUB_REPOSITORY || '').split('/')[1] || '';
const basePath = process.env.GITHUB_ACTIONS === 'true' && repo ? `/${repo}` : '';

const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  basePath,
  // assetPrefix ensures _next/static CSS & JS <link> tags carry the basePath
  // prefix so assets resolve correctly under the /repo-name subdirectory.
  assetPrefix: basePath,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
