import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { MemberAvatar } from "@/components/home/member-avatar";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { Member } from "@/lib/db-types";

export type MemberListProps = {
	members: Member[];
	currentMemberId?: string | null;
	/** When true, shows a remove action on other members. */
	canRemove?: boolean;
	onRemove?: (member: Member) => void;
};

function fullName(m: Member): string {
	return (
		[m.firstName, m.lastName].filter(Boolean).join(" ").trim() || "Sin nombre"
	);
}

export function MemberList({
	members,
	currentMemberId,
	canRemove = false,
	onRemove,
}: MemberListProps) {
	const theme = useTheme();

	const confirmRemove = (member: Member) => {
		const name = fullName(member);
		Alert.alert(
			"Eliminar miembro",
			`¿Quieres eliminar a ${name} del hogar? Podrá volver a unirse con el código de invitación.`,
			[
				{ text: "Cancelar", style: "cancel" },
				{
					text: "Eliminar",
					style: "destructive",
					onPress: () => onRemove?.(member),
				},
			],
		);
	};

	return (
		<View
			style={[
				styles.container,
				{ backgroundColor: theme.backgroundElement, borderColor: theme.border },
			]}
		>
			{members.map((m, idx) => {
				const isYou = m.id === currentMemberId;
				const showRemove = canRemove && !isYou && !!onRemove;
				return (
					<View
						key={m.id}
						style={[
							styles.row,
							idx < members.length - 1 && {
								borderBottomColor: theme.border,
								borderBottomWidth: StyleSheet.hairlineWidth,
							},
						]}
					>
						<MemberAvatar member={m} size="md" />
						<View style={styles.body}>
							<Text style={[styles.name, { color: theme.text }]}>
								{fullName(m)}
							</Text>
							<Text style={[styles.role, { color: theme.textSecondary }]}>
								{m.role === "admin" ? "Administrador" : "Miembro"}
							</Text>
						</View>
						{isYou ? (
							<Text style={[styles.you, { color: theme.accent }]}>Tú</Text>
						) : null}
						{showRemove ? (
							<Pressable
								onPress={() => confirmRemove(m)}
								hitSlop={8}
								accessibilityRole="button"
								accessibilityLabel={`Eliminar a ${fullName(m)}`}
								style={({ pressed }) => [
									{ opacity: pressed ? 0.5 : 1, padding: 4 },
								]}
							>
								<Ionicons name="trash-outline" size={20} color={theme.danger} />
							</Pressable>
						) : null}
					</View>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		borderRadius: Radius.lg,
		borderWidth: 1,
		overflow: "hidden",
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.three,
		padding: Spacing.three,
	},
	body: {
		flex: 1,
	},
	name: {
		fontSize: 15,
		fontWeight: "600",
	},
	role: {
		fontSize: 12,
		marginTop: 2,
	},
	you: {
		fontSize: 12,
		fontWeight: "700",
	},
});
