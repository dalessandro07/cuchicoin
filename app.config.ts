import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Dynamic Expo config. In production builds, set EXPO_PUBLIC_API_URL to the
 * deployed API origin (EAS Hosting or another host). That value is also used
 * as the Expo Router `origin` so native fetch/API routes resolve correctly.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const apiOrigin = process.env.EXPO_PUBLIC_API_URL?.trim() || undefined;
  const brandLogo = "./assets/images/logo.png";

  return {
    ...config,
    owner: "dalessandrorvs-team",
    name: "KuchiCoin",
    slug: "kuchicoin",
    version: "1.0.0",
    orientation: "portrait",
    icon: brandLogo,
    scheme: "kuchicoin",
    userInterfaceStyle: "automatic",
    ios: {
      icon: brandLogo,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: brandLogo,
        backgroundColor: "#000000",
      },
      predictiveBackGestureEnabled: false,
      package: "com.anonymous.kuchicoinapp",
    },
    web: {
      output: "server",
      favicon: brandLogo,
    },
    plugins: [
      apiOrigin ? ["expo-router", { origin: apiOrigin }] : "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#000000",
          image: brandLogo,
          imageWidth: 220,
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
