import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import * as Speech from "expo-speech";
import { Platform } from "react-native";

let activePlayer: ReturnType<typeof createAudioPlayer> | null = null;

function mimeToExt(mime: string | null | undefined): string {
	if (!mime) return "mp3";
	if (mime.includes("wav")) return "wav";
	if (mime.includes("ogg")) return "ogg";
	if (mime.includes("mp4") || mime.includes("m4a") || mime.includes("aac"))
		return "m4a";
	return "mp3";
}

async function playBase64Audio(
	base64: string,
	mime: string | null | undefined,
): Promise<boolean> {
	if (Platform.OS === "web") return false;
	const cacheDir = FileSystem.cacheDirectory;
	if (!cacheDir) return false;

	try {
		await setAudioModeAsync({ playsInSilentMode: true });
		const uri = `${cacheDir}assistant-tts-${Date.now()}.${mimeToExt(mime)}`;
		await FileSystem.writeAsStringAsync(uri, base64, {
			encoding: FileSystem.EncodingType.Base64,
		});
		if (activePlayer) {
			try {
				activePlayer.remove();
			} catch {
				/* ignore */
			}
			activePlayer = null;
		}
		const player = createAudioPlayer(uri);
		activePlayer = player;
		player.play();
		return true;
	} catch {
		return false;
	}
}

/** Prefer FreeLLM TTS audio; fall back to on-device expo-speech. */
export async function speakAssistantReply(opts: {
	text: string;
	audioBase64?: string | null;
	audioMime?: string | null;
}): Promise<void> {
	const text = opts.text.trim();
	if (!text && !opts.audioBase64) return;

	try {
		await Speech.stop();
	} catch {
		/* ignore */
	}

	if (opts.audioBase64) {
		const ok = await playBase64Audio(opts.audioBase64, opts.audioMime);
		if (ok) return;
	}

	if (!text) return;
	Speech.speak(text, {
		language: "es-PE",
		rate: 0.95,
		pitch: 1,
	});
}
