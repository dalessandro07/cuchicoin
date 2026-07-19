import { useMountEffect } from "@/hooks/use-mount-effect";
import { StyleSheet, View, type DimensionValue } from "react-native";
import Animated, {
	cancelAnimation,
	Easing,
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";

type ScanGleamOverlayProps = {
	active: boolean;
};

const BEAM_WIDTH = 72;

const SPARKLES: ReadonlyArray<{
	top: DimensionValue;
	left: DimensionValue;
	size: number;
	delay: number;
}> = [
	{ top: "18%", left: "22%", size: 5, delay: 0 },
	{ top: "38%", left: "68%", size: 4, delay: 220 },
	{ top: "58%", left: "34%", size: 6, delay: 480 },
	{ top: "72%", left: "78%", size: 4, delay: 700 },
	{ top: "28%", left: "52%", size: 3, delay: 160 },
];

const fill = {
	position: "absolute" as const,
	top: 0,
	right: 0,
	bottom: 0,
	left: 0,
};

function Sparkle({
	top,
	left,
	size,
	delay,
}: {
	top: DimensionValue;
	left: DimensionValue;
	size: number;
	delay: number;
}) {
	const pulse = useSharedValue(0);

	useMountEffect(() => {
		pulse.value = withDelay(
			delay,
			withRepeat(
				withSequence(
					withTiming(1, { duration: 420, easing: Easing.out(Easing.quad) }),
					withTiming(0.15, { duration: 520, easing: Easing.in(Easing.quad) }),
				),
				-1,
				false,
			),
		);
		return () => cancelAnimation(pulse);
	});

	const animStyle = useAnimatedStyle(() => ({
		opacity: pulse.value,
		transform: [{ scale: interpolate(pulse.value, [0, 1], [0.4, 1.25]) }],
	}));

	return (
		<Animated.View
			pointerEvents="none"
			style={[
				styles.sparkle,
				{
					top,
					left,
					width: size,
					height: size,
					borderRadius: size / 2,
				},
				animStyle,
			]}
		/>
	);
}

function ScanGleamInner() {
	const sweep = useSharedValue(0);
	const glow = useSharedValue(0);

	useMountEffect(() => {
		sweep.value = withRepeat(
			withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
			-1,
			false,
		);
		glow.value = withRepeat(
			withSequence(
				withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
				withTiming(0.35, { duration: 900, easing: Easing.inOut(Easing.sin) }),
			),
			-1,
			false,
		);
		return () => {
			cancelAnimation(sweep);
			cancelAnimation(glow);
		};
	});

	const beamStyle = useAnimatedStyle(() => {
		const x = interpolate(sweep.value, [0, 1], [-BEAM_WIDTH * 2, 420]);
		return {
			transform: [{ translateX: x }, { skewX: "-18deg" as const }],
			opacity: interpolate(
				sweep.value,
				[0, 0.12, 0.5, 0.88, 1],
				[0, 0.9, 1, 0.9, 0],
			),
		};
	});

	const glowStyle = useAnimatedStyle(() => ({
		opacity: interpolate(glow.value, [0, 1], [0.08, 0.28]),
	}));

	return (
		<View pointerEvents="none" style={styles.overlay}>
			<Animated.View style={[styles.brightness, glowStyle]} />
			<Animated.View style={[styles.beam, beamStyle]}>
				<View style={styles.beamCore} />
				<View style={styles.beamSoft} />
			</Animated.View>
			{SPARKLES.map((s) => (
				<Sparkle
					key={`${String(s.top)}-${String(s.left)}`}
					top={s.top}
					left={s.left}
					size={s.size}
					delay={s.delay}
				/>
			))}
		</View>
	);
}

/** Warm scan gleam (brightness sweep + sparkles) over a receipt preview. */
export function ScanGleamOverlay({ active }: ScanGleamOverlayProps) {
	if (!active) return null;
	return <ScanGleamInner />;
}

const styles = StyleSheet.create({
	overlay: {
		...fill,
		overflow: "hidden",
	},
	brightness: {
		...fill,
		backgroundColor: "#FFF8F0",
	},
	beam: {
		position: "absolute",
		top: -20,
		bottom: -20,
		width: BEAM_WIDTH,
		alignItems: "center",
	},
	beamCore: {
		flex: 1,
		width: 18,
		backgroundColor: "rgba(255, 248, 240, 0.92)",
	},
	beamSoft: {
		...fill,
		backgroundColor: "rgba(228, 162, 18, 0.35)",
	},
	sparkle: {
		position: "absolute",
		backgroundColor: "#FFF8F0",
		shadowColor: "#E4A212",
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.9,
		shadowRadius: 4,
		elevation: 2,
	},
});
