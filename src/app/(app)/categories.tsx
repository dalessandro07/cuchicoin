import { AuthInput } from "@/components/auth/auth-input";
import { PrimaryButton } from "@/components/auth/primary-button";
import { EmptyState } from "@/components/finance/empty-state";
import { TypeToggle } from "@/components/finance/type-toggle";
import { ThemedView } from "@/components/themed-view";
import {
	CATEGORY_COLORS,
	CATEGORY_ICONS,
	type IconName,
} from "@/constants/category-options";
import { MaxContentWidth, Radius, Spacing } from "@/constants/theme";
import { useHome } from "@/hooks/use-home";
import { useTheme } from "@/hooks/use-theme";
import type { Category, CategoryType } from "@/lib/db-types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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

type FormState = {
	id?: string;
	name: string;
	icon: IconName;
	color: string;
};

export default function CategoriesModal() {
	const theme = useTheme();
	const {
		categories,
		currentMember,
		createCategory,
		updateCategory,
		deleteCategory,
	} = useHome();
	const [type, setType] = useState<CategoryType>("expense");
	const [form, setForm] = useState<FormState | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const isAdmin = currentMember?.role === "admin";

	const list = categories.filter((c) => c.type === type);

	const startCreate = () =>
		setForm({ name: "", icon: CATEGORY_ICONS[0], color: CATEGORY_COLORS[0] });

	const startEdit = (category: Category) =>
		setForm({
			id: category.id,
			name: category.name,
			icon: category.icon as IconName,
			color: category.color,
		});

	const onSave = async () => {
		if (!form) return;
		if (form.name.trim().length < 2) {
			Alert.alert(
				"Nombre inválido",
				"El nombre debe tener al menos 2 caracteres",
			);
			return;
		}
		setSubmitting(true);
		try {
			if (form.id) {
				await updateCategory(form.id, {
					name: form.name.trim(),
					icon: form.icon,
					color: form.color,
				});
			} else {
				await createCategory({
					name: form.name.trim(),
					type,
					icon: form.icon,
					color: form.color,
				});
			}
			setForm(null);
		} catch (err) {
			Alert.alert(
				"Error",
				err instanceof Error ? err.message : "No se pudo guardar la categoría",
			);
		} finally {
			setSubmitting(false);
		}
	};

	const onDelete = (category: Category) => {
		Alert.alert(
			"Eliminar categoría",
			`¿Eliminar "${category.name}"? Solo se puede eliminar si no está en uso.`,
			[
				{ text: "Cancelar", style: "cancel" },
				{
					text: "Eliminar",
					style: "destructive",
					onPress: async () => {
						try {
							await deleteCategory(category.id);
						} catch (err) {
							Alert.alert(
								"Error",
								err instanceof Error ? err.message : "No se pudo eliminar",
							);
						}
					},
				},
			],
		);
	};

	if (!isAdmin) {
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
							Categorías
						</Text>
						<View style={styles.headerSpacer} />
					</View>
					<EmptyState
						icon="lock-closed-outline"
						title="Solo administradores"
						message="Pide al administrador del hogar que gestione las categorías."
					/>
				</SafeAreaView>
			</ThemedView>
		);
	}

	return (
		<ThemedView style={styles.container}>
			<SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
				<View style={styles.header}>
					<Pressable
						onPress={() => (form ? setForm(null) : router.back())}
						hitSlop={10}
						accessibilityRole="button"
						accessibilityLabel="Cerrar"
					>
						<Ionicons
							name={form ? "chevron-back" : "close"}
							size={26}
							color={theme.text}
						/>
					</Pressable>
					<Text style={[styles.headerTitle, { color: theme.text }]}>
						{form
							? form.id
								? "Editar categoría"
								: "Nueva categoría"
							: "Categorías"}
					</Text>
					<View style={styles.headerSpacer} />
				</View>

				<ScrollView
					contentContainerStyle={styles.scroll}
					keyboardShouldPersistTaps="handled"
				>
					{form ? (
						<>
							<View
								style={[
									styles.preview,
									{
										backgroundColor: theme.backgroundElement,
										borderColor: theme.border,
									},
								]}
							>
								<View
									style={[
										styles.previewIcon,
										{ backgroundColor: `${form.color}22` },
									]}
								>
									<Ionicons name={form.icon} size={28} color={form.color} />
								</View>
								<Text style={[styles.previewName, { color: theme.text }]}>
									{form.name.trim() || "Nombre de la categoría"}
								</Text>
							</View>

							<AuthInput
								label="Nombre"
								icon="pricetag-outline"
								value={form.name}
								onChangeText={(name) => setForm({ ...form, name })}
								placeholder="Ej. Mascotas"
								maxLength={30}
								autoCapitalize="sentences"
							/>

							<Text style={[styles.groupLabel, { color: theme.textSecondary }]}>
								Ícono
							</Text>
							<View style={styles.grid}>
								{CATEGORY_ICONS.map((icon) => {
									const active = form.icon === icon;
									return (
										<Pressable
											key={icon}
											onPress={() => setForm({ ...form, icon })}
											accessibilityRole="button"
											style={[
												styles.iconCell,
												{
													backgroundColor: active
														? `${form.color}22`
														: theme.backgroundElement,
													borderColor: active ? form.color : theme.border,
												},
											]}
										>
											<Ionicons
												name={icon}
												size={22}
												color={active ? form.color : theme.textSecondary}
											/>
										</Pressable>
									);
								})}
							</View>

							<Text style={[styles.groupLabel, { color: theme.textSecondary }]}>
								Color
							</Text>
							<View style={styles.grid}>
								{CATEGORY_COLORS.map((color) => {
									const active = form.color === color;
									return (
										<Pressable
											key={color}
											onPress={() => setForm({ ...form, color })}
											accessibilityRole="button"
											style={[
												styles.colorCell,
												{ backgroundColor: color, borderColor: theme.text },
												active && styles.colorActive,
											]}
										>
											{active ? (
												<Ionicons name="checkmark" size={18} color="#fff" />
											) : null}
										</Pressable>
									);
								})}
							</View>

							<PrimaryButton
								title={form.id ? "Guardar cambios" : "Crear categoría"}
								onPress={onSave}
								loading={submitting}
								style={styles.cta}
							/>
						</>
					) : (
						<>
							<TypeToggle value={type} onChange={setType} />

							{list.length === 0 ? (
								<EmptyState
									icon="pricetags-outline"
									title="Sin categorías"
									message="Crea la primera categoría de este tipo."
								/>
							) : (
								<View
									style={[
										styles.list,
										{
											backgroundColor: theme.background,
											borderColor: theme.border,
										},
									]}
								>
									{list.map((category, idx) => (
										<View
											key={category.id}
											style={[
												styles.row,
												idx < list.length - 1 && {
													borderBottomColor: theme.border,
													borderBottomWidth: StyleSheet.hairlineWidth,
												},
											]}
										>
											<View
												style={[
													styles.rowIcon,
													{ backgroundColor: `${category.color}22` },
												]}
											>
												<Ionicons
													name={category.icon as IconName}
													size={20}
													color={category.color}
												/>
											</View>
											<Text
												style={[styles.rowName, { color: theme.text }]}
												numberOfLines={1}
											>
												{category.name}
											</Text>
											<Pressable
												onPress={() => startEdit(category)}
												hitSlop={8}
												style={styles.rowAction}
											>
												<Ionicons
													name="pencil-outline"
													size={18}
													color={theme.textSecondary}
												/>
											</Pressable>
											<Pressable
												onPress={() => onDelete(category)}
												hitSlop={8}
												style={styles.rowAction}
											>
												<Ionicons
													name="trash-outline"
													size={18}
													color={theme.danger}
												/>
											</Pressable>
										</View>
									))}
								</View>
							)}

							<PrimaryButton
								title="Nueva categoría"
								onPress={startCreate}
								style={styles.cta}
							/>
						</>
					)}
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
		gap: Spacing.three,
	},
	list: {
		borderRadius: Radius.lg,
		borderWidth: 1,
		paddingHorizontal: Spacing.three,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.three,
		paddingVertical: Spacing.three,
	},
	rowIcon: {
		width: 40,
		height: 40,
		borderRadius: Radius.pill,
		alignItems: "center",
		justifyContent: "center",
	},
	rowName: {
		flex: 1,
		fontSize: 15,
		fontWeight: "600",
	},
	rowAction: {
		padding: Spacing.one,
	},
	cta: {
		marginTop: Spacing.two,
	},
	preview: {
		alignItems: "center",
		gap: Spacing.two,
		padding: Spacing.four,
		borderRadius: Radius.lg,
		borderWidth: 1,
	},
	previewIcon: {
		width: 60,
		height: 60,
		borderRadius: Radius.pill,
		alignItems: "center",
		justifyContent: "center",
	},
	previewName: {
		fontSize: 16,
		fontWeight: "700",
	},
	groupLabel: {
		fontSize: 13,
		fontWeight: "600",
		letterSpacing: 0.2,
		marginTop: Spacing.one,
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: Spacing.two,
	},
	iconCell: {
		width: 52,
		height: 52,
		borderRadius: Radius.md,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	colorCell: {
		width: 44,
		height: 44,
		borderRadius: Radius.pill,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 0,
	},
	colorActive: {
		borderWidth: 2,
	},
});
