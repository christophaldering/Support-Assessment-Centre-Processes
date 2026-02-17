/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  experimental: {
    instrumentationHook: true,
    serverActions: {
      bodySizeLimit: "50mb",
    },
    outputFileTracingIncludes: {
      "/api/w/\\[workspaceSlug\\]/case-studies/upload": ["./lib/pdf-extract.mjs", "./node_modules/pdfjs-dist/**/*"],
      "/api/w/\\[workspaceSlug\\]/requirements-analysis/extract": ["./lib/pdf-extract.mjs", "./node_modules/pdfjs-dist/**/*"],
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    PORT: "5000",
    HOSTNAME: "0.0.0.0",
  },
};

module.exports = nextConfig;
