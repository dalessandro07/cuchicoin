import { Redirect, Stack } from "expo-router";

import { HomeProvider } from "@/context/home-context";
import { useAuth } from "@/hooks/use-auth";

export default function AppLayout() {
	const { status } = useAuth();

	if (status === "loading") return null;
	if (status === "unauthenticated") return <Redirect href="/(auth)/login" />;

	return (
		<HomeProvider>
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="index" />
				<Stack.Screen name="create-home" />
				<Stack.Screen name="join-home" />
				<Stack.Screen name="home" />
				<Stack.Screen name="transaction" options={{ presentation: "modal" }} />
				<Stack.Screen name="scan-receipt" options={{ presentation: "modal" }} />
				<Stack.Screen name="categories" options={{ presentation: "modal" }} />
			</Stack>
		</HomeProvider>
	);
}
