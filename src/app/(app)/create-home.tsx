import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
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
import { z } from "zod";

import { AuthFooter } from "@/components/auth/auth-footer";
import { AuthInput } from "@/components/auth/auth-input";
import { PrimaryButton } from "@/components/auth/primary-button";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Radius, Spacing } from "@/constants/theme";
import { useHome } from "@/hooks/use-home";
import { useTheme } from "@/hooks/use-theme";
import type { Currency } from "@/lib/db-types";

const CURRENCY_OPTIONS: { value: Currency; label: string; hint: string }[] = [
	{ value: "PEN", label: "Soles (S/)", hint: "Perú" },
	{ value: "USD", label: "Dólares (US$)", hint: "USD" },
];

const createHomeSchema = z.object({
	name: z
		.string()
		.min(2, "Ingrese el nombre del hogar.")
		.max(40, "Máximo 40 caracteres")
		.regex(/^[\p{L}\p{N}\s'.-]+$/u, "Solo letras, números y espacios"),
	currency: z.enum(["PEN", "USD"], { message: "Selecciona una moneda" }),
});

type CreateHomeForm = z.infer<typeof createHomeSchema>;

export default function CreateHomeScreen() {
	const { createHome } = useHome();
	const theme = useTheme();
	const [submitting, setSubmitting] = useState(false);

	const {
		control,
		handleSubmit,
		formState: { errors, isValid },
	} = useForm<CreateHomeForm>({
		resolver: zodResolver(createHomeSchema),
		mode: "onChange",
		defaultValues: { name: "", currency: "PEN" },
	});

	const onSubmit = handleSubmit(async (values) => {
		setSubmitting(true);
		try {
			await createHome({ name: values.name, currency: values.currency });
			router.replace("/(app)/home");
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "No se pudo crear el hogar";
			Alert.alert("Error", message);
		} finally {
			setSubmitting(false);
		}
	});

	return (
		<ThemedView style={styles.container}>
			<SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
				<KeyboardAvoidingView
					style={styles.flex}
					behavior={Platform.OS === "ios" ? "padding" : undefined}
				>
					<ScrollView
						contentContainerStyle={styles.scroll}
						keyboardShouldPersistTaps="handled"
						showsVerticalScrollIndicator={false}
					>
						<Pressable
							onPress={() => router.back()}
							hitSlop={8}
							accessibilityRole="button"
							accessibilityLabel="Volver"
							style={styles.back}
						>
							<Ionicons name="chevron-back" size={24} color={theme.text} />
						</Pressable>

						<View style={styles.headerBlock}>
							<View
								style={[
									styles.iconWrap,
									{ backgroundColor: theme.backgroundElement },
								]}
							>
								<Ionicons
									name="add-circle-outline"
									size={32}
									color={theme.accent}
								/>
							</View>
							<Text style={[styles.title, { color: theme.text }]}>
								Crear un hogar nuevo
							</Text>
							<Text style={[styles.subtitle, { color: theme.textSecondary }]}>
								Serás el administrador del hogar y podrás invitar a tu familia
								con un código.
							</Text>
						</View>

						<View style={styles.form}>
							<Controller
								control={control}
								name="name"
								render={({ field: { value, onChange, onBlur } }) => (
									<AuthInput
										label="Nombre del hogar"
										icon="home-outline"
										value={value}
										onChangeText={onChange}
										onBlur={onBlur}
										error={errors.name?.message}
										placeholder="Familia Pérez"
										autoCapitalize="words"
										autoCorrect={false}
										returnKeyType="go"
										onSubmitEditing={onSubmit}
									/>
								)}
							/>

							<View style={styles.currencyBlock}>
								<Text
									style={[styles.currencyLabel, { color: theme.textSecondary }]}
								>
									Moneda del hogar
								</Text>
								<Controller
									control={control}
									name="currency"
									render={({ field: { value, onChange } }) => (
										<View style={styles.currencyOptions}>
											{CURRENCY_OPTIONS.map((option) => {
												const active = value === option.value;
												return (
													<Pressable
														key={option.value}
														onPress={() => onChange(option.value)}
														accessibilityRole="button"
														accessibilityState={{ selected: active }}
														style={[
															styles.currencyOption,
															{
																backgroundColor: active
																	? theme.backgroundSelected
																	: theme.backgroundElement,
																borderColor: active
																	? theme.primary
																	: theme.border,
															},
														]}
													>
														<Ionicons
															name="cash-outline"
															size={18}
															color={
																active ? theme.primary : theme.textSecondary
															}
														/>
														<View style={styles.currencyOptionText}>
															<Text
																style={[
																	styles.currencyOptionTitle,
																	{ color: theme.text },
																]}
															>
																{option.label}
															</Text>
															<Text
																style={[
																	styles.currencyOptionHint,
																	{ color: theme.textSecondary },
																]}
															>
																{option.hint}
															</Text>
														</View>
														{active ? (
															<Ionicons
																name="checkmark-circle"
																size={20}
																color={theme.primary}
															/>
														) : null}
													</Pressable>
												);
											})}
										</View>
									)}
								/>
								{errors.currency?.message ? (
									<Text style={[styles.currencyError, { color: theme.danger }]}>
										{errors.currency.message}
									</Text>
								) : null}
							</View>

							<PrimaryButton
								title="Crear hogar"
								onPress={onSubmit}
								loading={submitting}
								disabled={!isValid}
								style={styles.cta}
							/>

							<AuthFooter
								prompt="¿Ya tienes un código?"
								actionLabel="Unirme"
								onPress={() => router.replace("/(app)/join-home")}
							/>
						</View>
					</ScrollView>
				</KeyboardAvoidingView>
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
	flex: {
		flex: 1,
	},
	scroll: {
		flexGrow: 1,
		paddingHorizontal: Spacing.four,
		paddingTop: Spacing.two,
		paddingBottom: Spacing.four,
		gap: Spacing.four,
	},
	back: {
		alignSelf: "flex-start",
		paddingVertical: Spacing.one,
		paddingHorizontal: Spacing.two,
		marginLeft: -Spacing.two,
	},
	headerBlock: {
		alignItems: "center",
		gap: Spacing.two,
	},
	iconWrap: {
		width: 64,
		height: 64,
		borderRadius: Radius.xl,
		alignItems: "center",
		justifyContent: "center",
	},
	title: {
		fontSize: 22,
		fontWeight: "700",
		textAlign: "center",
	},
	subtitle: {
		fontSize: 14,
		lineHeight: 20,
		textAlign: "center",
		paddingHorizontal: Spacing.four,
	},
	form: {
		gap: Spacing.three,
	},
	currencyBlock: {
		gap: Spacing.two,
	},
	currencyLabel: {
		fontSize: 13,
		fontWeight: "600",
	},
	currencyOptions: {
		gap: Spacing.two,
	},
	currencyOption: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.two,
		paddingHorizontal: Spacing.three,
		paddingVertical: Spacing.three,
		borderRadius: Radius.md,
		borderWidth: 1,
	},
	currencyOptionText: {
		flex: 1,
		gap: 2,
	},
	currencyOptionTitle: {
		fontSize: 14,
		fontWeight: "700",
	},
	currencyOptionHint: {
		fontSize: 12,
	},
	currencyError: {
		fontSize: 12,
	},
	cta: {
		marginTop: Spacing.two,
	},
});
