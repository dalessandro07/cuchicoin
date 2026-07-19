import { AuthInput } from "@/components/auth/auth-input";
import { PrimaryButton } from "@/components/auth/primary-button";
import { AmountInput } from "@/components/finance/amount-input";
import { CategoryPicker } from "@/components/finance/category-picker";
import { DateTimeField } from "@/components/finance/datetime-field";
import { EmptyState } from "@/components/finance/empty-state";
import { TypeToggle } from "@/components/finance/type-toggle";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Radius, Spacing } from "@/constants/theme";
import { useAsyncData } from "@/hooks/use-async-data";
import { useHome } from "@/hooks/use-home";
import { useTheme } from "@/hooks/use-theme";
import { financeApi } from "@/lib/api-client";
import type { CategoryType } from "@/lib/db-types";
import { formatSoles, parseSolesToCents } from "@/lib/money";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FormInitial = {
	id?: string;
	type: CategoryType;
	amountText: string;
	categoryId: string | null;
	description: string;
	/** Unix seconds; defaults to now when omitted. */
	occurredAtSecs?: number;
};

function TransactionForm({ initial }: { initial: FormInitial }) {
	const theme = useTheme();
	const {
		categories,
		balance,
		currentMember,
		createTransaction,
		updateTransaction,
		deleteTransaction,
	} = useHome();
	const isEdit = !!initial.id;
	const isAdmin = currentMember?.role === "admin";

	const [type, setType] = useState<CategoryType>(initial.type);
	const [amountText, setAmountText] = useState(initial.amountText);
	const [categoryId, setCategoryId] = useState<string | null>(
		initial.categoryId,
	);
	const [description, setDescription] = useState(initial.description);
	const [occurredAt, setOccurredAt] = useState(
		() =>
			new Date(
				(initial.occurredAtSecs ?? Math.floor(Date.now() / 1000)) * 1000,
			),
	);
	const [submitting, setSubmitting] = useState(false);

	const tint = type === "income" ? theme.success : theme.danger;
	const typeCategories = categories.filter((c) => c.type === type);

	const changeType = (next: CategoryType) => {
		setType(next);
		const stillValid = categories.some(
			(c) => c.id === categoryId && c.type === next,
		);
		if (!stillValid) setCategoryId(null);
	};

	const persist = async (cents: number) => {
		setSubmitting(true);
		const date = Math.floor(occurredAt.getTime() / 1000);
		try {
			if (isEdit && initial.id) {
				await updateTransaction(initial.id, {
					type,
					amount: cents,
					categoryId,
					description,
					date,
				});
			} else {
				await createTransaction({
					type,
					amount: cents,
					categoryId,
					description,
					date,
				});
			}
			router.back();
		} catch (err) {
			Alert.alert(
				"Error",
				err instanceof Error ? err.message : "No se pudo guardar el movimiento",
			);
		} finally {
			setSubmitting(false);
		}
	};

	const onSave = async () => {
		const cents = parseSolesToCents(amountText);
		if (!cents || cents <= 0) {
			Alert.alert("Monto inválido", "Ingresa un monto mayor a S/ 0.00");
			return;
		}
		if (!categoryId) {
			Alert.alert(
				"Categoría requerida",
				"Selecciona una categoría antes de continuar.",
			);
			return;
		}

		if (type === "expense" && cents > balance.balanceCents) {
			Alert.alert(
				"Saldo insuficiente",
				"Este gasto supera el saldo disponible y el saldo quedará negativo. ¿Deseas continuar?",
				[
					{ text: "Cancelar", style: "cancel" },
					{
						text: "Continuar",
						style: "destructive",
						onPress: () => void persist(cents),
					},
				],
			);
			return;
		}

		await persist(cents);
	};

	const onDelete = () => {
		const transactionId = initial.id;
		if (!transactionId) return;
		Alert.alert(
			"Eliminar movimiento",
			"¿Seguro que quieres eliminarlo? Esta acción no se puede deshacer.",
			[
				{ text: "Cancelar", style: "cancel" },
				{
					text: "Eliminar",
					style: "destructive",
					onPress: async () => {
						setSubmitting(true);
						try {
							await deleteTransaction(transactionId);
							router.back();
						} catch (err) {
							Alert.alert(
								"Error",
								err instanceof Error ? err.message : "No se pudo eliminar",
							);
						} finally {
							setSubmitting(false);
						}
					},
				},
			],
		);
	};

	return (
		<KeyboardAvoidingView
			style={styles.flex}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
		>
			<ScrollView
				contentContainerStyle={styles.scroll}
				keyboardShouldPersistTaps="handled"
			>
				<View
					style={[
						styles.amountCard,
						{
							backgroundColor: theme.backgroundElement,
							borderColor: theme.border,
						},
					]}
				>
					<TypeToggle value={type} onChange={changeType} />
					<AmountInput
						value={amountText}
						onChangeText={setAmountText}
						tint={tint}
						autoFocus={!isEdit && !amountText}
					/>
					<Text style={[styles.preview, { color: theme.textSecondary }]}>
						{formatSoles(parseSolesToCents(amountText) ?? 0)}
					</Text>
				</View>

				<CategoryPicker
					categories={typeCategories}
					selectedId={categoryId}
					onSelect={setCategoryId}
					onManage={
						isAdmin ? () => router.push("/(app)/categories") : undefined
					}
				/>

				<AuthInput
					label="Descripción (opcional)"
					icon="create-outline"
					value={description}
					onChangeText={setDescription}
					placeholder="Ej. Compras del mercado"
					maxLength={120}
					returnKeyType="done"
				/>

				<DateTimeField value={occurredAt} onChange={setOccurredAt} />

				<PrimaryButton
					title={isEdit ? "Guardar cambios" : "Registrar"}
					onPress={onSave}
					loading={submitting}
					style={styles.cta}
				/>

				{isEdit ? (
					<Pressable
						onPress={onDelete}
						disabled={submitting}
						accessibilityRole="button"
						style={({ pressed }) => [
							styles.deleteButton,
							{ opacity: pressed ? 0.6 : 1 },
						]}
					>
						<Ionicons name="trash-outline" size={18} color={theme.danger} />
						<Text style={[styles.deleteText, { color: theme.danger }]}>
							Eliminar movimiento
						</Text>
					</Pressable>
				) : null}
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

function EditLoader({ id }: { id: string }) {
	const theme = useTheme();
	const { data, loading, error } = useAsyncData(
		() => financeApi.getTransaction(id),
		`txn:${id}`,
	);

	if (loading)
		return <ActivityIndicator style={styles.loader} color={theme.primary} />;
	if (error || !data) {
		return (
			<EmptyState
				icon="cloud-offline-outline"
				title="No se pudo cargar"
				message={error ?? undefined}
			/>
		);
	}

	const initial: FormInitial = {
		id: data.id,
		type: data.type,
		amountText: formatSoles(data.amount, { withSymbol: false }),
		categoryId: data.categoryId,
		description: data.description,
		occurredAtSecs: data.createdAt,
	};
	return <TransactionForm initial={initial} />;
}

function parseDateParam(raw: string | undefined): number | undefined {
	if (typeof raw !== "string" || raw.length === 0) return undefined;
	const secs = Number(raw);
	if (!Number.isFinite(secs) || secs <= 0) return undefined;
	return Math.floor(secs);
}

export default function TransactionModal() {
	const params = useLocalSearchParams<{
		id?: string;
		type?: string;
		amount?: string;
		description?: string;
		categoryId?: string;
		fromScan?: string;
		date?: string;
	}>();
	const theme = useTheme();
	const id = typeof params.id === "string" ? params.id : undefined;
	const paramType: CategoryType =
		params.type === "income" ? "income" : "expense";
	const fromScan = params.fromScan === "1";
	const amountText = typeof params.amount === "string" ? params.amount : "";
	const description =
		typeof params.description === "string" ? params.description : "";
	const categoryId =
		typeof params.categoryId === "string" && params.categoryId.length > 0
			? params.categoryId
			: null;
	const occurredAtSecs = parseDateParam(
		typeof params.date === "string" ? params.date : undefined,
	);

	const title = id
		? "Editar movimiento"
		: fromScan
			? "Confirmar escaneo"
			: paramType === "income"
				? "Nuevo ingreso"
				: "Nuevo gasto";

	return (
		<ThemedView style={styles.container}>
			<SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
				<View style={styles.header}>
					<Pressable
						onPress={() => router.back()}
						hitSlop={10}
						accessibilityRole="button"
						accessibilityLabel="Cerrar"
					>
						<Ionicons name="close" size={26} color={theme.text} />
					</Pressable>
					<Text style={[styles.headerTitle, { color: theme.text }]}>
						{title}
					</Text>
					<View style={styles.headerSpacer} />
				</View>

				{id ? (
					<EditLoader id={id} />
				) : (
					<TransactionForm
						initial={{
							type: paramType,
							amountText,
							categoryId,
							description,
							occurredAtSecs,
						}}
					/>
				)}
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
	flex: {
		flex: 1,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: Spacing.four,
		paddingVertical: Spacing.three,
	},
	headerTitle: {
		fontSize: 17,
		fontWeight: "700",
	},
	headerSpacer: {
		width: 26,
	},
	scroll: {
		padding: Spacing.four,
		paddingBottom: Spacing.six,
		gap: Spacing.four,
	},
	amountCard: {
		borderRadius: Radius.lg,
		borderWidth: 1,
		padding: Spacing.three,
		gap: Spacing.two,
	},
	preview: {
		textAlign: "center",
		fontSize: 13,
	},
	cta: {
		marginTop: Spacing.two,
	},
	deleteButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: Spacing.two,
		paddingVertical: Spacing.three,
	},
	deleteText: {
		fontSize: 15,
		fontWeight: "600",
	},
	loader: {
		paddingVertical: Spacing.six,
	},
});
