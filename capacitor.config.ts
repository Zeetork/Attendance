// import type { CapacitorConfig } from '@capacitor/cli';

// const config: CapacitorConfig = {
//   appId: 'com.example.app',
//   appName: 'attendance',
//   webDir: 'public'
// };

// export default config;

// capacitor.config.ts

import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.example.app",
  appName: "TruFlow",

  webDir: "public",

  server: {
    url: "https://attendance-truflow.vercel.app/",
    cleartext: false
  }
}

export default config