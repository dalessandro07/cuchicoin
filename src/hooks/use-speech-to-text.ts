/**
 * Thin wrapper around expo-speech-recognition. Isolates native listeners
 * so screens never call useEffect directly (aside from this reusable hook).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

type SpeechModule = typeof import("expo-speech-recognition");

function loadSpeechModule(): SpeechModule | null {
	if (Platform.OS === "web") return null;
	try {
		return require("expo-speech-recognition") as SpeechModule;
	} catch {
		return null;
	}
}

const speechModule = loadSpeechModule();

export type SpeechToTextState = {
	available: boolean;
	listening: boolean;
	partial: string;
	start: () => Promise<void>;
	stop: () => void;
};

export function useSpeechToText(opts: {
	lang?: string;
	onFinal?: (transcript: string) => void;
}): SpeechToTextState {
	const [listening, setListening] = useState(false);
	const [partial, setPartial] = useState("");
	const onFinalRef = useRef(opts.onFinal);
	onFinalRef.current = opts.onFinal;
	const lang = opts.lang ?? "es-PE";

	const available = (() => {
		if (!speechModule) return false;
		try {
			return speechModule.ExpoSpeechRecognitionModule.isRecognitionAvailable();
		} catch {
			return false;
		}
	})();

	useEffect(() => {
		if (!speechModule) return;
		const mod = speechModule.ExpoSpeechRecognitionModule;
		const subs = [
			mod.addListener("start", () => setListening(true)),
			mod.addListener("end", () => setListening(false)),
			mod.addListener("result", (event) => {
				const transcript = event.results[0]?.transcript?.trim() ?? "";
				if (!transcript) return;
				if (event.isFinal) {
					setPartial("");
					onFinalRef.current?.(transcript);
				} else {
					setPartial(transcript);
				}
			}),
			mod.addListener("error", () => {
				setListening(false);
				setPartial("");
			}),
		];
		return () => {
			for (const sub of subs) sub.remove();
			try {
				mod.abort();
			} catch {
				/* ignore */
			}
		};
	}, []);

	const start = useCallback(async () => {
		if (!speechModule || !available) return;
		const mod = speechModule.ExpoSpeechRecognitionModule;
		const mic = await mod.requestMicrophonePermissionsAsync();
		if (!mic.granted) {
			throw new Error("Necesitamos permiso del micrófono para dictar.");
		}
		const speech = await mod.requestPermissionsAsync();
		if (!speech.granted) {
			throw new Error("Necesitamos permiso de reconocimiento de voz.");
		}
		setPartial("");
		mod.start({
			lang,
			interimResults: true,
			continuous: false,
		});
	}, [available, lang]);

	const stop = useCallback(() => {
		try {
			speechModule?.ExpoSpeechRecognitionModule.stop();
		} catch {
			/* ignore */
		}
	}, []);

	return { available, listening, partial, start, stop };
}
