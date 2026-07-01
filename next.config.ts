import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // serverExternalPackages: ['@sparticuz/chromium'],
  /* config options here */
    serverExternalPackages: [
    "@sparticuz/chromium",
    "puppeteer-core",
  ],
};

export default nextConfig;