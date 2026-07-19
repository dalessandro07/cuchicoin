import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type QuickActionsProps = {
	onExpense: () => void;
	onIncome: () => void;
	onScan?: () => void;
	onAssistant?: () => void;
};

export function QuickActions({
	onExpense,
	onIncome,
	onScan,
	onAssistant,
}: QuickActionsProps) {
	const theme = useTheme();
	const showScan = Platform.OS !== "web" && !!onScan;

	return (
		<View style={styles.column}>
			<View style={styles.row}>
				<Pressable
					onPress={onExpense}
					accessibilityRole="button"
					accessibilityLabel="Registrar gasto"
					style={({ pressed }) => [
						styles.action,
						{
							backgroundColor: theme.background,
							borderColor: theme.border,
							opacity: pressed ? 0.7 : 1,
						},
					]}
				>
					<View
						style={[styles.iconWrap, { backgroundColor: `${theme.danger}1A` }]}
					>
						<Ionicons name="remove" size={26} color={theme.danger} />
					</View>
					<Text style={[styles.label, { color: theme.text }]}>
						Registrar gasto
					</Text>
				</Pressable>

				<Pressable
					onPress={onIncome}
					accessibilityRole="button"
					accessibilityLabel="Registrar ingreso"
					style={({ pressed }) => [
						styles.action,
						{
							backgroundColor: theme.background,
							borderColor: theme.border,
							opacity: pressed ? 0.7 : 1,
						},
					]}
				>
					<View
						style={[styles.iconWrap, { backgroundColor: `${theme.success}1A` }]}
					>
						<Ionicons name="add" size={26} color={theme.success} />
					</View>
					<Text style={[styles.label, { color: theme.text }]}>
						Registrar ingreso
					</Text>
				</Pressable>
			</View>

			{onAssistant ? (
				<Pressable
					onPress={onAssistant}
					accessibilityRole="button"
					accessibilityLabel="Asistente de voz y texto"
					style={({ pressed }) => [
						styles.scanAction,
						{
							backgroundColor: theme.background,
							borderColor: theme.border,
							opacity: pressed ? 0.7 : 1,
						},
					]}
				>
					<View
						style={[styles.iconWrap, { backgroundColor: `${theme.accent}1A` }]}
					>
						<Ionicons
							name="chatbubbles-outline"
							size={26}
							color={theme.accent}
						/>
					</View>
					<Text style={[styles.label, { color: theme.text }]}>Asistente</Text>
				</Pressable>
			) : null}

			{showScan ? (
				<Pressable
					onPress={onScan}
					accessibilityRole="button"
					accessibilityLabel="Escanear boleta"
					style={({ pressed }) => [
						styles.scanAction,
						{
							backgroundColor: theme.background,
							borderColor: theme.border,
							opacity: pressed ? 0.7 : 1,
						},
					]}
				>
					<View
						style={[styles.iconWrap, { backgroundColor: `${theme.accent}1A` }]}
					>
						<Ionicons name="scan-outline" size={26} color={theme.accent} />
					</View>
					<Text style={[styles.label, { color: theme.text }]}>
						Escanear boleta
					</Text>
				</Pressable>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	column: {
		gap: Spacing.three,
	},
	row: {
		flexDirection: "row",
		gap: Spacing.three,
	},
	action: {
		flex: 1,
		alignItems: "center",
		gap: Spacing.two,
		paddingVertical: Spacing.four,
		borderRadius: Radius.lg,
		borderWidth: 1,
	},
	scanAction: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: Spacing.three,
		paddingVertical: Spacing.three,
		borderRadius: Radius.lg,
		borderWidth: 1,
	},
	iconWrap: {
		width: 48,
		height: 48,
		borderRadius: Radius.pill,
		alignItems: "center",
		justifyContent: "center",
	},
	label: {
		fontSize: 14,
		fontWeight: "700",
	},
});
