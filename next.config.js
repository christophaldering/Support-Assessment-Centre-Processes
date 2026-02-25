/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(process.env.NODE_ENV === "production" ? { output: "standalone" } : {}),
  webpack: (config, { isServer, dev }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("pdfkit");
    }
    return config;
  },
  experimental: {
    instrumentationHook: true,
    serverActions: {
      bodySizeLimit: "50mb",
    },
    outputFileTracingIncludes: {
      "/api/w/\\[workspaceSlug\\]/case-studies/upload": ["./lib/pdf-extract.mjs", "./node_modules/pdfjs-dist/**/*"],
      "/api/w/\\[workspaceSlug\\]/requirements-analysis/extract": ["./lib/pdf-extract.mjs", "./node_modules/pdfjs-dist/**/*"],
      "/api/w/\\[workspaceSlug\\]/case-studies/\\[caseStudyId\\]/export-pdf": ["./node_modules/pdfkit/js/data/**/*"],
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
