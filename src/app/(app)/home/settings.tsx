import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
	Alert,
	Pressable,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { InviteCodeDisplay } from "@/components/home/invite-code-display";
import { MemberList } from "@/components/home/member-list";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useHome } from "@/hooks/use-home";
import { useTheme } from "@/hooks/use-theme";

export default function SettingsScreen() {
	const {
		currentHome,
		currentMember,
		members,
		leaveHome,
		clearHome,
		refresh,
		removeMember,
	} = useHome();
	const { signOut } = useAuth();
	const theme = useTheme();
	const [leaving, setLeaving] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [removingId, setRemovingId] = useState<string | null>(null);
	const isAdmin = currentMember?.role === "admin";
	const othersCount = members.filter((m) => m.id !== currentMember?.id).length;

	if (!currentHome) return null;

	const onRefresh = async () => {
		setRefreshing(true);
		try {
			await refresh();
		} finally {
			setRefreshing(false);
		}
	};

	const switchHome = () => {
		clearHome();
		router.replace("/(app)");
	};

	const onRemoveMember = async (memberId: string) => {
		setRemovingId(memberId);
		try {
			await removeMember(memberId);
		} catch (err) {
			Alert.alert(
				"Error",
				err instanceof Error ? err.message : "No se pudo eliminar al miembro",
			);
		} finally {
			setRemovingId(null);
		}
	};

	const leaveMessage =
		othersCount === 0
			? "¿Estás seguro? Eres el único miembro: el hogar y sus movimientos se eliminarán."
			: isAdmin
				? "¿Estás seguro? Si eres el único administrador, se asignará automáticamente a otro miembro."
				: "¿Estás seguro de que quieres salir de este hogar?";

	const confirmLeave = () => {
		Alert.alert("Salir del hogar", leaveMessage, [
			{ text: "Cancelar", style: "cancel" },
			{
				text: "Salir",
				style: "destructive",
				onPress: async () => {
					setLeaving(true);
					try {
						await leaveHome();
						router.replace("/(app)");
					} catch (err) {
						Alert.alert(
							"Error",
							err instanceof Error ? err.message : "No se pudo salir del hogar",
						);
					} finally {
						setLeaving(false);
					}
				},
			},
		]);
	};

	return (
		<ThemedView style={styles.container}>
			<SafeAreaView style={styles.safe} edges={["top"]}>
				<ScrollView
					contentContainerStyle={styles.scroll}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={() => void onRefresh()}
							tintColor={theme.primary}
							colors={[theme.primary]}
							progressBackgroundColor={theme.backgroundElement}
						/>
					}
				>
					<View style={styles.header}>
						<Text
							style={[styles.title, { color: theme.text }]}
							numberOfLines={1}
						>
							{currentHome.name}
						</Text>
						<Text style={[styles.subtitle, { color: theme.textSecondary }]}>
							Moneda {currentHome.currency}
						</Text>
					</View>

					<InviteCodeDisplay code={currentHome.inviteCode} />

					<View style={styles.section}>
						<Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
							Miembros ({members.length})
						</Text>
						<MemberList
							members={members}
							currentMemberId={currentMember?.id ?? null}
							canRemove={isAdmin && removingId === null}
							onRemove={(member) => void onRemoveMember(member.id)}
						/>
					</View>

					{isAdmin ? (
						<Pressable
							onPress={() => router.push("/(app)/categories")}
							accessibilityRole="button"
							style={({ pressed }) => [
								styles.rowButton,
								{
									backgroundColor: theme.backgroundElement,
									borderColor: theme.border,
									opacity: pressed ? 0.7 : 1,
								},
							]}
						>
							<View
								style={[styles.rowIcon, { backgroundColor: theme.background }]}
							>
								<Ionicons
									name="pricetags-outline"
									size={20}
									color={theme.accent}
								/>
							</View>
							<View style={styles.rowBody}>
								<Text style={[styles.rowTitle, { color: theme.text }]}>
									Categorías
								</Text>
								<Text style={[styles.rowDesc, { color: theme.textSecondary }]}>
									Crea y edita categorías de gastos e ingresos
								</Text>
							</View>
							<Ionicons
								name="chevron-forward"
								size={20}
								color={theme.textSecondary}
							/>
						</Pressable>
					) : null}

					<View style={styles.footerActions}>
						<Pressable
							onPress={switchHome}
							accessibilityRole="button"
							style={({ pressed }) => [
								styles.outlineButton,
								{ borderColor: theme.border, opacity: pressed ? 0.6 : 1 },
							]}
						>
							<Ionicons
								name="swap-horizontal-outline"
								size={18}
								color={theme.text}
							/>
							<Text style={[styles.outlineText, { color: theme.text }]}>
								Cambiar de hogar
							</Text>
						</Pressable>

						<Pressable
							onPress={confirmLeave}
							disabled={leaving}
							accessibilityRole="button"
							style={({ pressed }) => [
								styles.outlineButton,
								{
									borderColor: theme.danger,
									opacity: pressed || leaving ? 0.6 : 1,
								},
							]}
						>
							<Ionicons name="exit-outline" size={18} color={theme.danger} />
							<Text style={[styles.outlineText, { color: theme.danger }]}>
								{leaving ? "Saliendo…" : "Salir del hogar"}
							</Text>
						</Pressable>

						<Pressable
							onPress={signOut}
							accessibilityRole="button"
							style={({ pressed }) => [
								styles.outlineButton,
								{ borderColor: theme.border, opacity: pressed ? 0.6 : 1 },
							]}
						>
							<Ionicons name="log-out-outline" size={18} color={theme.text} />
							<Text style={[styles.outlineText, { color: theme.text }]}>
								Cerrar sesión
							</Text>
						</Pressable>
					</View>
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
		width: "100%",
		maxWidth: MaxContentWidth,
	},
	scroll: {
		padding: Spacing.four,
		paddingBottom: Spacing.six,
		gap: Spacing.four,
	},
	header: {
		gap: Spacing.one,
	},
	title: {
		fontSize: 24,
		fontWeight: "800",
	},
	subtitle: {
		fontSize: 13,
	},
	section: {
		gap: Spacing.two,
	},
	sectionTitle: {
		fontSize: 12,
		fontWeight: "600",
		letterSpacing: 0.3,
		textTransform: "uppercase",
	},
	rowButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.three,
		padding: Spacing.three,
		borderRadius: Radius.lg,
		borderWidth: 1,
	},
	rowIcon: {
		width: 42,
		height: 42,
		borderRadius: Radius.md,
		alignItems: "center",
		justifyContent: "center",
	},
	rowBody: {
		flex: 1,
		gap: 2,
	},
	rowTitle: {
		fontSize: 15,
		fontWeight: "700",
	},
	rowDesc: {
		fontSize: 12,
		lineHeight: 17,
	},
	footerActions: {
		gap: Spacing.three,
		marginTop: Spacing.two,
	},
	outlineButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: Spacing.two,
		borderWidth: 1,
		borderRadius: Radius.md,
		paddingVertical: Spacing.three,
	},
	outlineText: {
		fontSize: 15,
		fontWeight: "600",
	},
});
