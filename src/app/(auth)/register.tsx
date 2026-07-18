import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthFooter } from "@/components/auth/auth-footer";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthInput } from "@/components/auth/auth-input";
import { PasswordInput } from "@/components/auth/password-input";
import { PhoneInput } from "@/components/auth/phone-input";
import { PrimaryButton } from "@/components/auth/primary-button";
import { TermsCheckbox } from "@/components/auth/terms-checkbox";
import { ThemedText } from "@/components/themed-text";
import { PASSWORD_HINT } from "@/constants/auth";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { type RegisterForm, registerSchema } from "@/lib/validators";

export default function RegisterScreen() {
	const { signUp } = useAuth();
	const [submitting, setSubmitting] = useState(false);
	const [accept, setAccept] = useState(false);

	const {
		control,
		handleSubmit,
		setValue,
		formState: { errors, isValid },
	} = useForm<RegisterForm>({
		resolver: zodResolver(registerSchema),
		mode: "onChange",
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			phone: "",
			password: "",
			confirm: "",
			accept: false as unknown as true,
		},
	});

	const onSubmit = handleSubmit(async (values) => {
		setSubmitting(true);
		try {
			await signUp(values);
			Alert.alert(
				"Cuenta creada",
				"Tu cuenta se registró correctamente. Inicia sesión para continuar.",
				[
					{
						text: "Iniciar sesión",
						onPress: () => router.replace("/(auth)/login"),
					},
				],
			);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "No se pudo crear la cuenta";
			Alert.alert("Error", message);
		} finally {
			setSubmitting(false);
		}
	});

	return (
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
					<AuthHeader />

					<View style={styles.card}>
						<View style={styles.field}>
							<Controller
								control={control}
								name="firstName"
								render={({ field: { value, onChange, onBlur } }) => (
									<AuthInput
										label="Nombres"
										icon="person-outline"
										value={value}
										onChangeText={onChange}
										onBlur={onBlur}
										error={errors.firstName?.message}
										placeholder="María"
										autoCapitalize="words"
										autoComplete="given-name"
										textContentType="givenName"
										returnKeyType="next"
									/>
								)}
							/>
						</View>

						<View style={styles.field}>
							<Controller
								control={control}
								name="lastName"
								render={({ field: { value, onChange, onBlur } }) => (
									<AuthInput
										label="Apellidos"
										icon="person-outline"
										value={value}
										onChangeText={onChange}
										onBlur={onBlur}
										error={errors.lastName?.message}
										placeholder="García López"
										autoCapitalize="words"
										autoComplete="family-name"
										textContentType="familyName"
										returnKeyType="next"
									/>
								)}
							/>
						</View>

						<View style={styles.field}>
							<Controller
								control={control}
								name="email"
								render={({ field: { value, onChange, onBlur } }) => (
									<AuthInput
										label="Correo electrónico"
										icon="mail-outline"
										value={value}
										onChangeText={onChange}
										onBlur={onBlur}
										error={errors.email?.message}
										placeholder="tu@correo.com"
										keyboardType="email-address"
										autoCapitalize="none"
										autoCorrect={false}
										autoComplete="email"
										textContentType="emailAddress"
										returnKeyType="next"
									/>
								)}
							/>
						</View>

						<View style={styles.field}>
							<Controller
								control={control}
								name="phone"
								render={({ field: { value, onChange, onBlur } }) => (
									<PhoneInput
										label="Teléfono"
										value={value}
										onChangeText={onChange}
										onBlur={onBlur}
										error={errors.phone?.message}
									/>
								)}
							/>
						</View>

						<View style={styles.field}>
							<Controller
								control={control}
								name="password"
								render={({ field: { value, onChange, onBlur } }) => (
									<>
										<PasswordInput
											label="Contraseña"
											value={value}
											onChangeText={onChange}
											onBlur={onBlur}
											error={errors.password?.message}
											placeholder="••••••••"
											autoComplete="new-password"
											textContentType="newPassword"
											returnKeyType="next"
										/>
										<ThemedText
											type="small"
											themeColor="textSecondary"
											style={styles.hint}
										>
											{PASSWORD_HINT}
										</ThemedText>
									</>
								)}
							/>
						</View>

						<View style={styles.field}>
							<Controller
								control={control}
								name="confirm"
								render={({ field: { value, onChange, onBlur } }) => (
									<PasswordInput
										label="Confirmar contraseña"
										value={value}
										onChangeText={onChange}
										onBlur={onBlur}
										error={errors.confirm?.message}
										placeholder="••••••••"
										autoComplete="new-password"
										textContentType="newPassword"
										returnKeyType="go"
										onSubmitEditing={onSubmit}
									/>
								)}
							/>
						</View>

						<TermsCheckbox
							value={accept}
							onValueChange={(next) => {
								setAccept(next);
								setValue("accept", next as unknown as true, {
									shouldValidate: true,
								});
							}}
							onOpenTerms={() => router.push("/(auth)/terms")}
							onOpenPrivacy={() => router.push("/(auth)/privacy")}
							error={errors.accept?.message}
						/>

						<PrimaryButton
							title="Crear cuenta"
							onPress={onSubmit}
							loading={submitting}
							disabled={!isValid || !accept}
							style={styles.cta}
						/>
					</View>

					<View style={styles.footer}>
						<AuthFooter
							prompt="¿Ya tienes una cuenta?"
							actionLabel="Inicia sesión"
							onPress={() => router.push("/(auth)/login")}
						/>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
	},
	flex: {
		flex: 1,
	},
	scroll: {
		paddingHorizontal: Spacing.four,
		paddingBottom: Spacing.four,
		gap: Spacing.four,
	},
	card: {
		gap: Spacing.three,
	},
	field: {
		gap: Spacing.two,
	},
	hint: {
		marginTop: Spacing.one,
	},
	cta: {
		marginTop: Spacing.two,
	},
	footer: {
		marginTop: Spacing.three,
	},
});
