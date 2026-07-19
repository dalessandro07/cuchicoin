import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Radius, Spacing } from "@/constants/theme";
import { useHome } from "@/hooks/use-home";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { useTheme } from "@/hooks/use-theme";
import { ApiClientError, financeApi } from "@/lib/api-client";
import { speakAssistantReply } from "@/lib/assistant-speech";
import { formatSoles } from "@/lib/money";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ChatRole = "user" | "assistant";

type ChatBubble = {
	id: string;
	role: ChatRole;
	content: string;
};

const WELCOME: ChatBubble = {
	id: "welcome",
	role: "assistant",
	content:
		"Hola. Dime un gasto o ingreso en lenguaje natural, por ejemplo: «Gasté 25 soles en menú del día» o «Recibí 500 de sueldo».",
};

export default function AssistantModal() {
	const theme = useTheme();
	const { currentHome, status: homeStatus, syncNow } = useHome();
	const [messages, setMessages] = useState<ChatBubble[]>([WELCOME]);
	const [input, setInput] = useState("");
	const [sending, setSending] = useState(false);
	const listRef = useRef<FlatList<ChatBubble>>(null);
	const historyRef = useRef<{ role: ChatRole; content: string }[]>([]);
	/** Pin home for this modal session so a context refresh cannot blank the chat. */
	const homeIdRef = useRef<string | null>(currentHome?.id ?? null);
	if (currentHome?.id) homeIdRef.current = currentHome.id;
	const homeId = homeIdRef.current ?? currentHome?.id ?? null;

	const sendText = async (raw: string) => {
		const text = raw.trim();
		const activeHomeId = homeIdRef.current ?? currentHome?.id ?? null;
		if (!text || !activeHomeId || sending) return;

		const userMsg: ChatBubble = {
			id: `u-${Date.now()}`,
			role: "user",
			content: text,
		};
		setMessages((prev) => [...prev, userMsg]);
		setInput("");
		setSending(true);

		const nextHistory: { role: ChatRole; content: string }[] = [
			...historyRef.current,
			{ role: "user", content: text },
		];
		if (nextHistory.length > 20) nextHistory.splice(0, nextHistory.length - 20);
		historyRef.current = nextHistory;

		try {
			const result = await financeApi.chatAssistant({
				homeId: activeHomeId,
				messages: nextHistory,
			});

			const assistantMsg: ChatBubble = {
				id: `a-${Date.now()}`,
				role: "assistant",
				content: result.reply,
			};
			setMessages((prev) => [...prev, assistantMsg]);
			const withReply: { role: ChatRole; content: string }[] = [
				...nextHistory,
				{ role: "assistant", content: result.reply },
			];
			if (withReply.length > 20) withReply.splice(0, withReply.length - 20);
			historyRef.current = withReply;

			if (result.transaction) {
				try {
					await syncNow();
				} catch {
					/* keep chat usable even if dashboard sync fails */
				}
				const label =
					result.transaction.type === "expense" ? "gasto" : "ingreso";
				const confirm =
					result.reply ||
					`Listo, registré un ${label} de ${formatSoles(result.transaction.amount)}.`;
				await speakAssistantReply({
					text: confirm,
					audioBase64: result.audioBase64,
					audioMime: result.audioMime,
				});
			}
		} catch (err) {
			const message =
				err instanceof ApiClientError || err instanceof Error
					? err.message
					: "No se pudo hablar con el asistente";
			const errMsg: ChatBubble = {
				id: `e-${Date.now()}`,
				role: "assistant",
				content: message,
			};
			setMessages((prev) => [...prev, errMsg]);
		} finally {
			setSending(false);
			requestAnimationFrame(() =>
				listRef.current?.scrollToEnd({ animated: true }),
			);
		}
	};

	const stt = useSpeechToText({
		lang: "es-PE",
		onFinal: (transcript) => {
			void sendText(transcript);
		},
	});

	const toggleMic = async () => {
		if (sending) return;
		if (stt.listening) {
			stt.stop();
			return;
		}
		try {
			await stt.start();
		} catch (err) {
			Alert.alert(
				"Micrófono",
				err instanceof Error ? err.message : "No se pudo iniciar el dictado",
			);
		}
	};

	if (homeStatus === "loading" && !homeId) {
		return (
			<ThemedView style={styles.container}>
				<SafeAreaView style={styles.safe}>
					<View style={styles.centered}>
						<ActivityIndicator color={theme.primary} />
					</View>
				</SafeAreaView>
			</ThemedView>
		);
	}

	if (!homeId) {
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
							Asistente
						</Text>
						<View style={styles.headerSpacer} />
					</View>
					<Text style={[styles.emptyHint, { color: theme.textSecondary }]}>
						Elige un hogar antes de usar el asistente.
					</Text>
				</SafeAreaView>
			</ThemedView>
		);
	}

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
						Asistente
					</Text>
					<View style={styles.headerSpacer} />
				</View>

				<KeyboardAvoidingView
					style={styles.flex}
					behavior={Platform.OS === "ios" ? "padding" : undefined}
					keyboardVerticalOffset={8}
				>
					<FlatList
						ref={listRef}
						data={messages}
						keyExtractor={(item) => item.id}
						contentContainerStyle={styles.list}
						onContentSizeChange={() =>
							listRef.current?.scrollToEnd({ animated: true })
						}
						renderItem={({ item }) => {
							const mine = item.role === "user";
							return (
								<View
									style={[
										styles.bubble,
										mine ? styles.bubbleUser : styles.bubbleAssistant,
										{
											backgroundColor: mine
												? theme.accent
												: theme.backgroundElement,
											borderColor: theme.border,
										},
									]}
								>
									<Text
										style={[
											styles.bubbleText,
											{ color: mine ? theme.primaryContrast : theme.text },
										]}
									>
										{item.content}
									</Text>
								</View>
							);
						}}
						ListFooterComponent={
							sending ? (
								<View style={styles.thinking}>
									<ActivityIndicator color={theme.primary} />
									<Text style={{ color: theme.textSecondary, fontSize: 13 }}>
										Pensando…
									</Text>
								</View>
							) : stt.listening && stt.partial ? (
								<Text style={[styles.partial, { color: theme.textSecondary }]}>
									{stt.partial}
								</Text>
							) : null
						}
					/>

					<View
						style={[
							styles.composer,
							{
								borderTopColor: theme.border,
								backgroundColor: theme.background,
							},
						]}
					>
						{stt.available ? (
							<Pressable
								onPress={() => void toggleMic()}
								disabled={sending}
								accessibilityRole="button"
								accessibilityLabel={
									stt.listening ? "Detener dictado" : "Dictar gasto o ingreso"
								}
								style={({ pressed }) => [
									styles.micBtn,
									{
										backgroundColor: stt.listening
											? `${theme.danger}22`
											: theme.backgroundElement,
										borderColor: stt.listening ? theme.danger : theme.border,
										opacity: pressed || sending ? 0.7 : 1,
									},
								]}
							>
								<Ionicons
									name={stt.listening ? "stop" : "mic"}
									size={22}
									color={stt.listening ? theme.danger : theme.accent}
								/>
							</Pressable>
						) : null}

						<TextInput
							value={input}
							onChangeText={setInput}
							placeholder="Escribe o dicta un movimiento…"
							placeholderTextColor={theme.textSecondary}
							editable={!sending && !stt.listening}
							multiline
							style={[
								styles.input,
								{
									color: theme.text,
									backgroundColor: theme.backgroundElement,
									borderColor: theme.border,
								},
							]}
							onSubmitEditing={() => void sendText(input)}
						/>

						<Pressable
							onPress={() => void sendText(input)}
							disabled={sending || !input.trim()}
							accessibilityRole="button"
							accessibilityLabel="Enviar"
							style={({ pressed }) => [
								styles.sendBtn,
								{
									backgroundColor: theme.accent,
									opacity: sending || !input.trim() ? 0.4 : pressed ? 0.85 : 1,
								},
							]}
						>
							<Ionicons name="send" size={18} color={theme.primaryContrast} />
						</Pressable>
					</View>
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
	centered: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	emptyHint: {
		padding: Spacing.four,
		fontSize: 15,
		lineHeight: 22,
	},
	list: {
		paddingHorizontal: Spacing.four,
		paddingBottom: Spacing.three,
		gap: Spacing.two,
	},
	bubble: {
		maxWidth: "88%",
		paddingHorizontal: Spacing.three,
		paddingVertical: Spacing.two + 2,
		borderRadius: Radius.lg,
		borderWidth: StyleSheet.hairlineWidth,
	},
	bubbleUser: {
		alignSelf: "flex-end",
	},
	bubbleAssistant: {
		alignSelf: "flex-start",
	},
	bubbleText: {
		fontSize: 15,
		lineHeight: 21,
	},
	thinking: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.two,
		paddingVertical: Spacing.two,
	},
	partial: {
		fontSize: 13,
		fontStyle: "italic",
		paddingVertical: Spacing.two,
	},
	composer: {
		flexDirection: "row",
		alignItems: "flex-end",
		gap: Spacing.two,
		paddingHorizontal: Spacing.three,
		paddingVertical: Spacing.three,
		borderTopWidth: StyleSheet.hairlineWidth,
	},
	micBtn: {
		width: 44,
		height: 44,
		borderRadius: Radius.pill,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	input: {
		flex: 1,
		minHeight: 44,
		maxHeight: 120,
		borderWidth: 1,
		borderRadius: Radius.lg,
		paddingHorizontal: Spacing.three,
		paddingVertical: Spacing.two + 2,
		fontSize: 15,
	},
	sendBtn: {
		width: 44,
		height: 44,
		borderRadius: Radius.pill,
		alignItems: "center",
		justifyContent: "center",
	},
});
