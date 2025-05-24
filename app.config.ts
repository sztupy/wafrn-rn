import type { ExpoConfig } from 'expo/config'
import pkg from './package.json'

export default {
  expo: {
    newArchEnabled: true,
    name: 'Wafrn',
    slug: 'wafrn-rn',
    version: pkg.version,
    orientation: 'portrait',
    icon: './assets/images/logo_w.png',
    scheme: 'wafrn',
    userInterfaceStyle: 'dark',
    splash: {
      image: './assets/images/wafrn-logo.png',
      resizeMode: 'contain',
      backgroundColor: '#151718',
    },
    platforms: ['ios', 'android'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'hu.sztupy.wafrn_rn',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSPhotoLibraryAddUsageDescription:
          'WAFRN requires write-only access to your library in order to download images and videos from posts',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/logo_w.png',
        backgroundColor: '#151718',
      },
      permissions: [],
      package: 'hu.sztupy.wafrn_rn',
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            { scheme: 'http', host: 'app.wafrn.net' },
            { scheme: 'https', host: 'app.wafrn.net' },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-font',
      [
        'expo-video',
        {
          supportsBackgroundPlayback: true,
          supportsPictureInPicture: true,
        },
      ],
    ],
    experiments: {
      typedRoutes: false,
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: '1e73ecdd-4a5b-452a-8cc2-9b36ca469515',
      },
    },
    runtimeVersion: pkg.version,
    updates: {
      url: 'https://u.expo.dev/1e73ecdd-4a5b-452a-8cc2-9b36ca469515',
    },
  } satisfies ExpoConfig,
}
