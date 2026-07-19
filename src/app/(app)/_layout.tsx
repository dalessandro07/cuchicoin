import { Redirect, router, Stack, usePathname } from "expo-router";

import { HomeProvider } from "@/context/home-context";
import { useAuth } from "@/hooks/use-auth";
import { useHome } from "@/hooks/use-home";
import { useKeyedEffect } from "@/hooks/use-mount-effect";
import { useOptionalShareIntent } from "@/lib/share-intent";

function ShareIntentRouteBridge() {
	const pathname = usePathname();
	const { status: homeStatus } = useHome();
	const { isReady, hasShareIntent } = useOptionalShareIntent();
	const onScanScreen = pathname.includes("scan-receipt");
	const bridgeKey = `${isReady}|${hasShareIntent}|${homeStatus}|${onScanScreen}`;

	useKeyedEffect(bridgeKey, () => {
		if (!isReady || !hasShareIntent || homeStatus === "loading") return;
		if (onScanScreen) return;
		router.push("/(app)/scan-receipt");
	});

	return null;
}

export default function AppLayout() {
	const { status } = useAuth();

	if (status === "loading") return null;
	if (status === "unauthenticated") return <Redirect href="/(auth)/login" />;

	return (
		<HomeProvider>
			<ShareIntentRouteBridge />
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="index" />
				<Stack.Screen name="create-home" />
				<Stack.Screen name="join-home" />
				<Stack.Screen name="home" />
				<Stack.Screen name="transaction" options={{ presentation: "modal" }} />
				<Stack.Screen name="scan-receipt" options={{ presentation: "modal" }} />
				<Stack.Screen name="assistant" options={{ presentation: "modal" }} />
				<Stack.Screen name="categories" options={{ presentation: "modal" }} />
			</Stack>
		</HomeProvider>
	);
}
