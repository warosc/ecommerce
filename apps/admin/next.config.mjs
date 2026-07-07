/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@optimus/contracts'],
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,
};

export default nextConfig;
