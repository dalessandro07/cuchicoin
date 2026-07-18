import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Redirect, router } from "expo-router";
import { useState } from "react";
import {
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChoiceCard } from "@/components/home/choice-card";
import { type ChooserTab, ChooserTabs } from "@/components/home/chooser-tabs";
import { HomeListRow } from "@/components/home/home-list-row";
import { ThemedView } from "@/components/themed-view";
import { BRAND } from "@/constants/brand";
import { MaxContentWidth, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useHome } from "@/hooks/use-home";
import { useTheme } from "@/hooks/use-theme";

export default function HomeChooserScreen() {
	const { signOut } = useAuth();
	const { status, homes, selectHome } = useHome();
	const theme = useTheme();
	const [tab, setTab] = useState<ChooserTab>("homes");
	const [selectingId, setSelectingId] = useState<string | null>(null);

	if (status === "loading") return null;
	if (status === "in-home") {
		return <Redirect href="/(app)/home" />;
	}

	const hasHomes = homes.length > 0;
	const activeTab = hasHomes ? tab : "create";

	const onSelectHome = async (homeId: string) => {
		setSelectingId(homeId);
		try {
			await selectHome(homeId);
			router.replace("/(app)/home");
		} catch (err) {
			Alert.alert(
				"Error",
				err instanceof Error ? err.message : "No se pudo abrir el hogar",
			);
		} finally {
			setSelectingId(null);
		}
	};

	return (
		<ThemedView style={styles.container}>
			<SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
				<ScrollView
					contentContainerStyle={styles.scroll}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
				>
					<View style={styles.intro}>
						<Image
							source={BRAND.logoSource}
							style={styles.logo}
							contentFit="contain"
						/>
						<Text style={[styles.heading, { color: theme.text }]}>
							{hasHomes ? "Elige un hogar" : "¿Cómo quieres empezar?"}
						</Text>
						<Text style={[styles.slogan, { color: theme.textSecondary }]}>
							{hasHomes
								? "Entra a uno de tus hogares o crea / únete a uno nuevo"
								: "Crea un hogar nuevo o únete a uno con un código de invitación"}
						</Text>
					</View>

					{hasHomes ? (
						<ChooserTabs value={activeTab} onChange={setTab} />
					) : null}

					{activeTab === "homes" ? (
						<View style={styles.list}>
							{homes.map(({ home, membership }) => (
								<HomeListRow
									key={home.id}
									home={home}
									membership={membership}
									disabled={selectingId !== null}
									onPress={() => onSelectHome(home.id)}
								/>
							))}
						</View>
					) : (
						<View style={styles.cards}>
							<ChoiceCard
								icon="add-circle-outline"
								title="Crear un hogar nuevo"
								description="Serás el administrador y podrás invitar a los demás miembros."
								onPress={() => router.push("/(app)/create-home")}
							/>
							<ChoiceCard
								icon="people-outline"
								title="Unirme a un grupo"
								description="Ingresa el código de invitación que te compartió tu familia."
								onPress={() => router.push("/(app)/join-home")}
							/>
						</View>
					)}

					<Pressable
						onPress={signOut}
						accessibilityRole="button"
						style={({ pressed }) => [
							styles.signOut,
							{ borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
						]}
					>
						<Ionicons name="log-out-outline" size={18} color={theme.text} />
						<Text style={[styles.signOutText, { color: theme.text }]}>
							Cerrar sesión
						</Text>
					</Pressable>
				</ScrollView>
			</SafeAreaView>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: "row",
		justifyContent: "center",
	},
	safe: {
		flex: 1,
		maxWidth: MaxContentWidth,
	},
	scroll: {
		flexGrow: 1,
		paddingHorizontal: Spacing.four,
		paddingTop: Spacing.four,
		paddingBottom: Spacing.four,
		gap: Spacing.five,
	},
	intro: {
		alignItems: "center",
		gap: Spacing.two,
	},
	logo: {
		width: 96,
		height: 96,
	},
	heading: {
		fontSize: 22,
		fontWeight: "700",
		textAlign: "center",
	},
	slogan: {
		fontSize: 14,
		lineHeight: 20,
		textAlign: "center",
		paddingHorizontal: Spacing.three,
	},
	list: {
		gap: Spacing.three,
	},
	cards: {
		gap: Spacing.three,
	},
	signOut: {
		marginTop: "auto",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: Spacing.two,
		borderWidth: 1,
		borderRadius: Radius.md,
		paddingVertical: Spacing.three,
	},
	signOutText: {
		fontSize: 15,
		fontWeight: "600",
	},
});
