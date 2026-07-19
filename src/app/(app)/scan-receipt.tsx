import { PrimaryButton } from "@/components/auth/primary-button";
import { ScanGleamOverlay } from "@/components/finance/scan-gleam-overlay";
import { HomeListRow } from "@/components/home/home-list-row";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Radius, Spacing } from "@/constants/theme";
import { useHome } from "@/hooks/use-home";
import { useKeyedEffect } from "@/hooks/use-mount-effect";
import { useTheme } from "@/hooks/use-theme";
import { ApiClientError, financeApi } from "@/lib/api-client";
import {
	ImagePickerUnavailableError,
	isImagePickerAvailable,
	pickImageFromLibrary,
	takePhotoWithCamera,
} from "@/lib/image-picker";
import { formatSoles } from "@/lib/money";
import {
	isReceiptOcrSupported,
	ReceiptOcrError,
	recognizeReceiptText,
} from "@/lib/receipt-ocr";
import { useOptionalShareIntent } from "@/lib/share-intent";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Phase = "idle" | "pick-home" | "ocr" | "ai" | "done" | "error";

export default function ScanReceiptModal() {
	const theme = useTheme();
	const {
		categories,
		currentHome,
		homes,
		status: homeStatus,
		selectHome,
	} = useHome();
	const params = useLocalSearchParams<{ imageUri?: string }>();
	const { isReady, hasShareIntent, shareIntent, resetShareIntent } =
		useOptionalShareIntent();

	const [imageUri, setImageUri] = useState<string | null>(
		typeof params.imageUri === "string" ? params.imageUri : null,
	);
	const [phase, setPhase] = useState<Phase>("idle");
	const [error, setError] = useState<string | null>(null);
	const [selectingId, setSelectingId] = useState<string | null>(null);
	const processedRef = useRef<string | null>(null);

	const pickerAvailable = isImagePickerAvailable();
	const scanReady = Platform.OS === "web" ? false : pickerAvailable;
	const busy = phase === "ocr" || phase === "ai" || selectingId !== null;

	const sharedPath =
		hasShareIntent && shareIntent.files?.[0]?.path
			? shareIntent.files[0].path
			: "";
	const pendingUri =
		sharedPath || (typeof params.imageUri === "string" ? params.imageUri : "");

	useKeyedEffect(sharedPath, () => {
		if (sharedPath) setImageUri(sharedPath);
	});

	const goToTransaction = (analysis: {
		type: "expense" | "income";
		amountCents: number;
		description: string;
		categoryId: string | null;
		date: number;
	}) => {
		setPhase("done");
		resetShareIntent();
		router.replace({
			pathname: "/(app)/transaction",
			params: {
				type: analysis.type,
				amount: formatSoles(analysis.amountCents, { withSymbol: false }),
				description: analysis.description,
				categoryId: analysis.categoryId ?? "",
				fromScan: "1",
				date: String(analysis.date),
			},
		});
	};

	const processImage = async (
		uri: string,
		opts?: { skipHomeCheck?: boolean; categoriesOverride?: typeof categories },
	) => {
		if (!uri || processedRef.current === uri) return;
		if (homeStatus === "loading") return;

		setImageUri(uri);

		if (!opts?.skipHomeCheck && !currentHome) {
			setPhase("pick-home");
			setError(null);
			return;
		}

		// Claim this URI immediately so concurrent effects cannot start a second OCR.
		processedRef.current = uri;

		let activeCategories = opts?.categoriesOverride ?? categories;
		if (activeCategories.length === 0 && currentHome) {
			try {
				const detail = await financeApi.getHomeDetail(currentHome.id);
				activeCategories = detail.categories;
			} catch {
				processedRef.current = null;
				setPhase("error");
				setError("No se pudieron cargar las categorías del hogar.");
				return;
			}
		}

		if (activeCategories.length === 0) {
			processedRef.current = null;
			setPhase("error");
			setError(
				"Aún no hay categorías en este hogar. Espera un momento e intenta de nuevo.",
			);
			return;
		}

		if (!isReceiptOcrSupported()) {
			processedRef.current = null;
			setPhase("error");
			setError(
				"El OCR no está disponible en este dispositivo. Usa un development build.",
			);
			return;
		}

		setError(null);
		setPhase("ocr");

		const categoryPayload = activeCategories.map((c) => ({
			id: c.id,
			name: c.name,
			type: c.type,
		}));

		try {
			const ocrText = await recognizeReceiptText(uri);
			setPhase("ai");
			const analysis = await financeApi.analyzeReceipt({
				ocrText,
				categories: categoryPayload,
			});
			goToTransaction(analysis);
		} catch (err) {
			processedRef.current = null;
			const message =
				err instanceof ReceiptOcrError ||
				err instanceof ApiClientError ||
				err instanceof Error
					? err.message
					: "No se pudo analizar la boleta";
			setPhase("error");
			setError(message);
		}
	};

	const processKey =
		pendingUri && isReady
			? `${pendingUri}|${homeStatus}|${isReady}|${currentHome?.id ?? ""}`
			: "";

	useKeyedEffect(processKey, () => {
		if (!pendingUri || !isReady || homeStatus === "loading") return;
		if (!currentHome) {
			setImageUri(pendingUri);
			setPhase("pick-home");
			return;
		}
		void processImage(pendingUri);
	});

	const onSelectHomeForScan = async (homeId: string) => {
		const uri = imageUri || pendingUri;
		if (!uri) return;
		setSelectingId(homeId);
		setError(null);
		try {
			await selectHome(homeId);
			const detail = await financeApi.getHomeDetail(homeId);
			processedRef.current = null;
			await processImage(uri, {
				skipHomeCheck: true,
				categoriesOverride: detail.categories,
			});
		} catch (err) {
			Alert.alert(
				"Error",
				err instanceof Error ? err.message : "No se pudo abrir el hogar",
			);
			setPhase("pick-home");
		} finally {
			setSelectingId(null);
		}
	};

	const pickFromLibrary = async () => {
		try {
			const uri = await pickImageFromLibrary();
			if (!uri) return;
			processedRef.current = null;
			await processImage(uri);
		} catch (err) {
			Alert.alert(
				"No se pudo abrir la galería",
				err instanceof ImagePickerUnavailableError || err instanceof Error
					? err.message
					: "Error desconocido",
			);
		}
	};

	const takePhoto = async () => {
		try {
			const uri = await takePhotoWithCamera();
			if (!uri) return;
			processedRef.current = null;
			await processImage(uri);
		} catch (err) {
			Alert.alert(
				"No se pudo abrir la cámara",
				err instanceof ImagePickerUnavailableError || err instanceof Error
					? err.message
					: "Error desconocido",
			);
		}
	};

	const pickingHome = phase === "pick-home";
	const hasHomes = homes.length > 0;
	const scanning = phase === "ocr" || phase === "ai";

	const statusLabel = pickingHome
		? hasHomes
			? "Elige el hogar donde registrarás esta boleta."
			: "Crea o únete a un hogar para escanear esta boleta."
		: phase === "ocr"
			? "Leyendo texto con OCR…"
			: phase === "ai"
				? "Analizando la boleta…"
				: phase === "error"
					? error
					: "Toma una foto o elige una captura de boleta, ticket o transferencia.";

	return (
		<ThemedView style={styles.container}>
			<SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
				<View style={styles.header}>
					<Pressable
						onPress={() => {
							resetShareIntent();
							router.back();
						}}
						hitSlop={10}
						accessibilityRole="button"
						accessibilityLabel="Cerrar"
					>
						<Ionicons name="close" size={26} color={theme.text} />
					</Pressable>
					<Text style={[styles.headerTitle, { color: theme.text }]}>
						{pickingHome ? "Elegir hogar" : "Escanear boleta"}
					</Text>
					<View style={styles.headerSpacer} />
				</View>

				<ScrollView
					contentContainerStyle={styles.scroll}
					keyboardShouldPersistTaps="handled"
				>
					<View
						style={[
							styles.preview,
							{
								backgroundColor: theme.backgroundElement,
								borderColor: theme.border,
							},
						]}
					>
						{imageUri ? (
							<>
								<Image
									source={{ uri: imageUri }}
									style={styles.image}
									contentFit="contain"
								/>
								<ScanGleamOverlay active={scanning} />
							</>
						) : (
							<View style={styles.placeholder}>
								<Ionicons
									name="scan-outline"
									size={48}
									color={theme.textSecondary}
								/>
								<Text
									style={[
										styles.placeholderText,
										{ color: theme.textSecondary },
									]}
								>
									Vista previa
								</Text>
							</View>
						)}
					</View>

					<View style={styles.statusRow}>
						{busy && !pickingHome ? (
							<ActivityIndicator color={theme.primary} />
						) : null}
						<Text
							style={[
								styles.statusText,
								{
									color: phase === "error" ? theme.danger : theme.textSecondary,
								},
							]}
						>
							{statusLabel}
						</Text>
					</View>

					{pickingHome ? (
						hasHomes ? (
							<View style={styles.homeList}>
								{homes.map(({ home, membership }) => (
									<HomeListRow
										key={home.id}
										home={home}
										membership={membership}
										disabled={selectingId !== null}
										onPress={() => void onSelectHomeForScan(home.id)}
									/>
								))}
							</View>
						) : (
							<View style={styles.homeList}>
								<PrimaryButton
									title="Crear un hogar"
									onPress={() => router.push("/(app)/create-home")}
								/>
								<Pressable
									onPress={() => router.push("/(app)/join-home")}
									accessibilityRole="button"
									style={({ pressed }) => [
										styles.secondaryBtn,
										{
											borderColor: theme.border,
											backgroundColor: theme.backgroundElement,
											opacity: pressed ? 0.85 : 1,
										},
									]}
								>
									<Text
										style={[styles.secondaryBtnText, { color: theme.text }]}
									>
										Unirme con código
									</Text>
								</Pressable>
							</View>
						)
					) : (
						<>
							{!scanReady ? (
								<Text style={[styles.hint, { color: theme.danger }]}>
									{Platform.OS === "web"
										? "El escáner no está disponible en web."
										: "Falta el módulo nativo de cámara/galería. Recompila con: npx expo run:android o eas build -p android --profile development."}
								</Text>
							) : null}

							<PrimaryButton
								title="Tomar foto"
								onPress={takePhoto}
								disabled={busy || !scanReady}
							/>
							<Pressable
								onPress={pickFromLibrary}
								disabled={busy || !scanReady}
								accessibilityRole="button"
								style={({ pressed }) => [
									styles.secondaryBtn,
									{
										borderColor: theme.border,
										backgroundColor: theme.backgroundElement,
										opacity: busy || !scanReady ? 0.5 : pressed ? 0.85 : 1,
									},
								]}
							>
								<Text style={[styles.secondaryBtnText, { color: theme.text }]}>
									Elegir de galería
								</Text>
							</Pressable>
							{phase === "error" && imageUri ? (
								<PrimaryButton
									title="Reintentar"
									onPress={() => {
										processedRef.current = null;
										void processImage(imageUri);
									}}
									disabled={busy}
								/>
							) : null}
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
	preview: {
		height: 280,
		borderRadius: Radius.lg,
		borderWidth: 1,
		overflow: "hidden",
	},
	image: {
		width: "100%",
		height: "100%",
	},
	placeholder: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: Spacing.two,
	},
	placeholderText: {
		fontSize: 14,
	},
	statusRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.two,
		minHeight: 40,
	},
	statusText: {
		flex: 1,
		fontSize: 14,
		lineHeight: 20,
	},
	hint: {
		fontSize: 13,
		lineHeight: 18,
	},
	homeList: {
		gap: Spacing.three,
	},
	secondaryBtn: {
		borderRadius: Radius.pill,
		borderWidth: 1,
		paddingVertical: Spacing.three,
		alignItems: "center",
	},
	secondaryBtnText: {
		fontSize: 16,
		fontWeight: "700",
	},
});
