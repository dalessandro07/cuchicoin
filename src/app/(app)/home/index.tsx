import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BalanceHeader } from "@/components/finance/balance-header";
import { EmptyState } from "@/components/finance/empty-state";
import { QuickActions } from "@/components/finance/quick-actions";
import { TransactionRow } from "@/components/finance/transaction-row";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useHome } from "@/hooks/use-home";
import { useMoneyVisibility } from "@/hooks/use-money-visibility";
import { useTheme } from "@/hooks/use-theme";
import type { TransactionView } from "@/lib/db-types";

export default function DashboardScreen() {
	const { currentHome, balance, recentTransactions } = useHome();
	const theme = useTheme();
	const { hidden } = useMoneyVisibility();

	if (!currentHome) return null;

	const openNew = (type: "expense" | "income") =>
		router.push({ pathname: "/(app)/transaction", params: { type } });

	const openScan = () => router.push("/(app)/scan-receipt");
	const openAssistant = () =>
		router.push("/(app)/assistant" as Parameters<typeof router.push>[0]);

	const openEdit = (transaction: TransactionView) =>
		router.push({
			pathname: "/(app)/transaction",
			params: { id: transaction.id },
		});

	return (
		<ThemedView style={styles.container}>
			<SafeAreaView style={styles.safe} edges={["top"]}>
				<ScrollView
					contentContainerStyle={styles.scroll}
					showsVerticalScrollIndicator={false}
				>
					<BalanceHeader homeName={currentHome.name} balance={balance} />

					<QuickActions
						onExpense={() => openNew("expense")}
						onIncome={() => openNew("income")}
						onScan={openScan}
						onAssistant={openAssistant}
					/>

					<View style={styles.sectionHeader}>
						<Text style={[styles.sectionTitle, { color: theme.text }]}>
							Últimos movimientos
						</Text>
						{recentTransactions.length > 0 ? (
							<Pressable
								onPress={() => router.push("/(app)/home/history")}
								hitSlop={8}
								accessibilityRole="button"
							>
								<Text style={[styles.link, { color: theme.accent }]}>
									Ver todo
								</Text>
							</Pressable>
						) : null}
					</View>

					<View
						style={[
							styles.list,
							{ backgroundColor: theme.background, borderColor: theme.border },
						]}
					>
						{recentTransactions.length === 0 ? (
							<EmptyState
								icon="wallet-outline"
								title="Aún no hay movimientos"
								message="Registra tu primer gasto o ingreso con los botones de arriba."
							/>
						) : (
							recentTransactions.map((transaction, idx) => (
								<TransactionRow
									key={transaction.id}
									transaction={transaction}
									hidden={hidden}
									onPress={openEdit}
									showDivider={idx < recentTransactions.length - 1}
								/>
							))
						)}
					</View>
				</ScrollView>

				<Pressable
					onPress={() => openNew("expense")}
					accessibilityRole="button"
					accessibilityLabel="Registrar movimiento"
					style={({ pressed }) => [
						styles.fab,
						{ backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 },
					]}
				>
					<Ionicons name="add" size={30} color={theme.primaryContrast} />
				</Pressable>
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
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	sectionTitle: {
		fontSize: 17,
		fontWeight: "700",
	},
	link: {
		fontSize: 14,
		fontWeight: "700",
	},
	list: {
		borderRadius: 16,
		borderWidth: 1,
		paddingHorizontal: Spacing.three,
	},
	fab: {
		position: "absolute",
		right: Spacing.four,
		bottom: Spacing.four,
		width: 60,
		height: 60,
		borderRadius: 30,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000",
		shadowOpacity: 0.2,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 4 },
		elevation: 6,
	},
});
