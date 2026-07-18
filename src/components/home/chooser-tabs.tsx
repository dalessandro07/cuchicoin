import { Pressable, StyleSheet, Text, View } from "react-native";

import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type ChooserTab = "homes" | "create";

export type ChooserTabsProps = {
	value: ChooserTab;
	onChange: (value: ChooserTab) => void;
};

const OPTIONS: { key: ChooserTab; label: string }[] = [
	{ key: "homes", label: "Mis hogares" },
	{ key: "create", label: "Crear o unirse" },
];

export function ChooserTabs({ value, onChange }: ChooserTabsProps) {
	const theme = useTheme();

	return (
		<View
			style={[
				styles.container,
				{ backgroundColor: theme.backgroundElement, borderColor: theme.border },
			]}
		>
			{OPTIONS.map((option) => {
				const active = value === option.key;
				return (
					<Pressable
						key={option.key}
						onPress={() => onChange(option.key)}
						accessibilityRole="button"
						accessibilityState={{ selected: active }}
						style={[
							styles.segment,
							active && { backgroundColor: theme.primary },
						]}
					>
						<Text
							style={[
								styles.label,
								{ color: active ? theme.primaryContrast : theme.textSecondary },
							]}
						>
							{option.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		borderRadius: Radius.md,
		borderWidth: 1,
		padding: 4,
		gap: 4,
	},
	segment: {
		flex: 1,
		paddingVertical: Spacing.two,
		borderRadius: Radius.sm,
		alignItems: "center",
		justifyContent: "center",
	},
	label: {
		fontSize: 14,
		fontWeight: "700",
	},
});
