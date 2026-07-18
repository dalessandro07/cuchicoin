import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { Home, Member } from "@/lib/db-types";

export type HomeListRowProps = {
	home: Home;
	membership: Member;
	onPress: () => void;
	disabled?: boolean;
};

export function HomeListRow({
	home,
	membership,
	onPress,
	disabled,
}: HomeListRowProps) {
	const theme = useTheme();
	const roleLabel = membership.role === "admin" ? "Administrador" : "Miembro";

	return (
		<Pressable
			onPress={onPress}
			disabled={disabled}
			accessibilityRole="button"
			accessibilityLabel={`Entrar a ${home.name}`}
			style={({ pressed }) => [
				styles.row,
				{
					backgroundColor: theme.backgroundElement,
					borderColor: theme.border,
					opacity: pressed || disabled ? 0.7 : 1,
				},
			]}
		>
			<View style={[styles.iconWrap, { backgroundColor: theme.background }]}>
				<Ionicons name="home-outline" size={22} color={theme.accent} />
			</View>
			<View style={styles.body}>
				<Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
					{home.name}
				</Text>
				<Text style={[styles.meta, { color: theme.textSecondary }]}>
					{roleLabel} · {home.currency}
				</Text>
			</View>
			<Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
		</Pressable>
	);
}

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.three,
		padding: Spacing.four,
		borderRadius: Radius.lg,
		borderWidth: 1,
	},
	iconWrap: {
		width: 44,
		height: 44,
		borderRadius: Radius.md,
		alignItems: "center",
		justifyContent: "center",
	},
	body: {
		flex: 1,
		gap: Spacing.half,
	},
	title: {
		fontSize: 16,
		fontWeight: "700",
	},
	meta: {
		fontSize: 13,
		lineHeight: 18,
	},
});
