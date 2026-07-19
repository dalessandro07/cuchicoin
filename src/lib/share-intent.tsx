/**
 * Optional share-intent provider. Falls back to a no-op when the native
 * module is not linked (stale APK / Expo Go).
 */

import { createContext, type ReactNode, useContext } from "react";

type ShareFile = { path?: string; mimeType?: string; fileName?: string };

export type ShareIntentState = {
	hasShareIntent: boolean;
	shareIntent: { files?: ShareFile[] | null };
	resetShareIntent: (clearNativeModule?: boolean) => void;
};

const EMPTY: ShareIntentState = {
	hasShareIntent: false,
	shareIntent: { files: null },
	resetShareIntent: () => {},
};

const ShareContext = createContext<ShareIntentState>(EMPTY);

type NativeMod = {
	ShareIntentProvider: (props: { children: ReactNode }) => ReactNode;
	useShareIntentContext: () => ShareIntentState;
};

let nativeMod: NativeMod | null | undefined;

function getNativeMod(): NativeMod | null {
	if (nativeMod !== undefined) return nativeMod;
	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		nativeMod = require("expo-share-intent") as NativeMod;
	} catch {
		nativeMod = null;
	}
	return nativeMod;
}

function NativeShareBridge({
	useNative,
	children,
}: {
	useNative: () => ShareIntentState;
	children: ReactNode;
}) {
	const value = useNative();
	return (
		<ShareContext.Provider value={value}>{children}</ShareContext.Provider>
	);
}

export function OptionalShareIntentProvider({
	children,
}: {
	children: ReactNode;
}) {
	const mod = getNativeMod();
	if (mod) {
		return (
			<mod.ShareIntentProvider>
				<NativeShareBridge useNative={mod.useShareIntentContext}>
					{children}
				</NativeShareBridge>
			</mod.ShareIntentProvider>
		);
	}
	return (
		<ShareContext.Provider value={EMPTY}>{children}</ShareContext.Provider>
	);
}

export function useOptionalShareIntent(): ShareIntentState {
	return useContext(ShareContext);
}
