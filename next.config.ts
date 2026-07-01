// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   // serverExternalPackages: ['@sparticuz/chromium'],
//   /* config options here */
//     serverExternalPackages: [
//     "@sparticuz/chromium",
//     "puppeteer-core",
//   ],
// };

// export default nextConfig;


import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@sparticuz/chromium",
    "puppeteer-core",
  ],
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/@sparticuz/chromium/bin/**/*'],
  },
  experimental: {
    serverComponentsExternalPackages: [
      "@sparticuz/chromium",
      "puppeteer-core",
    ],
  },
};

export default nextConfig;