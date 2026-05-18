import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.renqing',
  appName: '记账本',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
