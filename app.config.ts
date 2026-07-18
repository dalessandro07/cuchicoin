import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Dynamic Expo config. In production builds, set EXPO_PUBLIC_API_URL to the
 * deployed API origin (EAS Hosting or another host). That value is also used
 * as the Expo Router `origin` so native fetch/API routes resolve correctly.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const apiOrigin = process.env.EXPO_PUBLIC_API_URL?.trim() || undefined;

  return {
    ...config,
    owner: "dalessandrorvs-team",
    name: "kuchicoin-app",
    slug: "kuchicoin",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "kuchicoin",
    userInterfaceStyle: "automatic",
    ios: {
      icon: "./assets/expo.icon",
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
      package: "com.anonymous.kuchicoinapp",
    },
    web: {
      output: "server",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      apiOrigin ? ["expo-router", { origin: apiOrigin }] : "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#208AEF",
          image: "./assets/images/splash-icon.png",
          imageWidth: 76,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      apiUrl: apiOrigin ?? null,
      eas: {
        projectId: "638498da-f0a3-4a43-889e-9fe5bf77356f",
      },
    },
  };
};
