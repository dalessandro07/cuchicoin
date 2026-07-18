import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/finance/empty-state";
import { MonthSection } from "@/components/finance/month-section";
import { TransactionRow } from "@/components/finance/transaction-row";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Radius, Spacing } from "@/constants/theme";
import { useAsyncData } from "@/hooks/use-async-data";
import { useHome } from "@/hooks/use-home";
import { useMoneyVisibility } from "@/hooks/use-money-visibility";
import { useKeyedEffect } from "@/hooks/use-mount-effect";
import { useTheme } from "@/hooks/use-theme";
import { financeApi } from "@/lib/api-client";
import type { Member, TransactionView } from "@/lib/db-types";
import { currentMonthKey } from "@/lib/money";

function memberLabel(m: Member): string {
	const name = `${m.firstName} ${m.lastName}`.trim();
	return name || m.email;
}

function MemberFilterChips({
	members,
	selectedId,
	onSelect,
}: {
	members: Member[];
	selectedId: string | null;
	onSelect: (id: string | null) => void;
}) {
	const theme = useTheme();

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			style={styles.chipsScroll}
			contentContainerStyle={styles.chipsRow}
		>
			<Pressable
				onPress={() => onSelect(null)}
				accessibilityRole="button"
				style={[
					styles.chip,
					{
						backgroundColor:
							selectedId === null ? theme.primary : theme.backgroundElement,
						borderColor: selectedId === null ? theme.primary : theme.border,
					},
				]}
			>
				<Text
					style={[
						styles.chipText,
						{ color: selectedId === null ? theme.primaryContrast : theme.text },
					]}
				>
					Todos
				</Text>
			</Pressable>
			{members.map((m) => {
				const active = selectedId === m.id;
				return (
					<Pressable
						key={m.id}
						onPress={() => onSelect(m.id)}
						accessibilityRole="button"
						style={[
							styles.chip,
							{
								backgroundColor: active
									? theme.primary
									: theme.backgroundElement,
								borderColor: active ? theme.primary : theme.border,
							},
						]}
					>
						<Text
							style={[
								styles.chipText,
								{ color: active ? theme.primaryContrast : theme.text },
							]}
							numberOfLines={1}
						>
							{memberLabel(m)}
						</Text>
					</Pressable>
				);
			})}
		</ScrollView>
	);
}

function MonthList({
	homeId,
	memberId,
	hidden,
	filterActive,
}: {
	homeId: string;
	memberId: string | null;
	hidden: boolean;
	filterActive: boolean;
}) {
	const theme = useTheme();
	const memberKey = memberId ?? "all";
	const {
		data: months,
		loading,
		error,
	} = useAsyncData(
		() => financeApi.listMonths(homeId, memberId ? { memberId } : undefined),
		`months:${homeId}:${memberKey}`,
	);

	const [expanded, setExpanded] = useState<string | null>(null);
	const [cache, setCache] = useState<Record<string, TransactionView[]>>({});
	const [loadingMonth, setLoadingMonth] = useState<string | null>(null);

	const loadMonth = useCallback(
		async (month: string) => {
			setLoadingMonth(month);
			try {
				const items = await financeApi.listTransactions(homeId, {
					month,
					memberId: memberId ?? undefined,
				});
				setCache((prev) => ({ ...prev, [month]: items }));
			} finally {
				setLoadingMonth(null);
			}
		},
		[homeId, memberId],
	);

	const defaultMonth =
		months && months.length > 0
			? (months.find((m) => m.month === currentMonthKey())?.month ??
				months[0].month)
			: null;

	useKeyedEffect(
		`expand:${homeId}:${memberKey}:${defaultMonth ?? "none"}`,
		() => {
			if (!defaultMonth) return;
			setExpanded(defaultMonth);
			void loadMonth(defaultMonth);
		},
	);

	const toggle = useCallback(
		async (month: string) => {
			if (expanded === month) {
				setExpanded(null);
				return;
			}
			setExpanded(month);
			if (!cache[month]) {
				await loadMonth(month);
			}
		},
		[expanded, cache, loadMonth],
	);

	if (loading) {
		return <ActivityIndicator style={styles.loader} color={theme.primary} />;
	}

	if (error) {
		return (
			<EmptyState
				icon="cloud-offline-outline"
				title="No se pudo cargar"
				message={error}
			/>
		);
	}

	if (!months || months.length === 0) {
		return (
			<EmptyState
				icon="time-outline"
				title="No existen movimientos registrados."
				message={
					filterActive
						? "Este integrante no tiene movimientos en el historial."
						: undefined
				}
			/>
		);
	}

	return (
		<View style={styles.sections}>
			{months.map((bucket) => (
				<MonthSection
					key={bucket.month}
					bucket={bucket}
					expanded={expanded === bucket.month}
					hidden={hidden}
					onToggle={toggle}
				>
					{loadingMonth === bucket.month ? (
						<ActivityIndicator style={styles.loader} color={theme.primary} />
					) : (
						(cache[bucket.month] ?? []).map((transaction, idx, arr) => (
							<TransactionRow
								key={transaction.id}
								transaction={transaction}
								hidden={hidden}
								onPress={(t) =>
									router.push({
										pathname: "/(app)/transaction",
										params: { id: t.id },
									})
								}
								showDivider={idx < arr.length - 1}
							/>
						))
					)}
				</MonthSection>
			))}
		</View>
	);
}

export default function HistoryScreen() {
	const { currentHome, members, dataVersion } = useHome();
	const { hidden } = useMoneyVisibility();
	const theme = useTheme();
	const [memberId, setMemberId] = useState<string | null>(null);

	if (!currentHome) return null;

	return (
		<ThemedView style={styles.container}>
			<SafeAreaView style={styles.safe} edges={["top"]}>
				<Text style={[styles.heading, { color: theme.text }]}>Historial</Text>
				{members.length > 1 ? (
					<MemberFilterChips
						members={members}
						selectedId={memberId}
						onSelect={setMemberId}
					/>
				) : null}
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scroll}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
				>
					<MonthList
						key={`${currentHome.id}:${dataVersion}:${memberId ?? "all"}`}
						homeId={currentHome.id}
						memberId={memberId}
						hidden={hidden}
						filterActive={memberId !== null}
					/>
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
		alignItems: "stretch",
	},
	safe: {
		flex: 1,
		width: "100%",
		maxWidth: MaxContentWidth,
		alignItems: "stretch",
	},
	heading: {
		fontSize: 24,
		fontWeight: "800",
		paddingHorizontal: Spacing.four,
		paddingTop: Spacing.two,
		paddingBottom: Spacing.two,
	},
	chipsScroll: {
		flexGrow: 0,
		flexShrink: 0,
	},
	chipsRow: {
		paddingHorizontal: Spacing.four,
		paddingBottom: Spacing.three,
		gap: Spacing.two,
		flexDirection: "row",
		alignItems: "center",
	},
	chip: {
		paddingHorizontal: Spacing.three,
		paddingVertical: Spacing.one + 2,
		borderRadius: Radius.pill,
		borderWidth: 1,
		maxWidth: 160,
	},
	chipText: {
		fontSize: 13,
		fontWeight: "600",
	},
	scrollView: {
		flex: 1,
	},
	scroll: {
		flexGrow: 1,
		justifyContent: "flex-start",
		paddingHorizontal: Spacing.four,
		paddingBottom: Spacing.six,
		gap: Spacing.three,
	},
	sections: {
		gap: Spacing.three,
		width: "100%",
	},
	loader: {
		paddingVertical: Spacing.four,
		alignSelf: "center",
	},
});
