/** @type {import('next').NextConfig} */
const nextConfig = {
  // Genera un servidor autocontenido para una imagen Docker mínima.
  output: 'standalone',
  // El monorepo comparte tipos vía @optimus/contracts (TS sin compilar).
  transpilePackages: ['@optimus/contracts'],
  // La raíz del monorepo (para el trace de ficheros de `standalone`).
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,
};

export default nextConfig;
