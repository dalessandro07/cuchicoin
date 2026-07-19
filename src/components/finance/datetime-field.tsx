import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
	type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { formatLimaDateTime, PERU_TZ } from "@/lib/peru-datetime";

export type DateTimeFieldProps = {
	value: Date;
	onChange: (next: Date) => void;
	/** Maximum selectable date (defaults to now + small buffer). */
	maximumDate?: Date;
};

type PickerMode = "date" | "time" | null;

function toDatetimeLocalValue(date: Date): string {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: PERU_TZ,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).formatToParts(date);
	const get = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((p) => p.type === type)?.value ?? "00";
	const hour = get("hour") === "24" ? "00" : get("hour");
	return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

export function DateTimeField({
	value,
	onChange,
	maximumDate,
}: DateTimeFieldProps) {
	const theme = useTheme();
	const [pickerMode, setPickerMode] = useState<PickerMode>(null);
	const label = formatLimaDateTime(Math.floor(value.getTime() / 1000));
	const max = maximumDate ?? new Date();

	const applyNativeChange = (event: DateTimePickerEvent, selected?: Date) => {
		if (Platform.OS === "android") {
			setPickerMode(null);
		}
		if (event.type === "dismissed" || !selected) {
			if (Platform.OS === "ios") setPickerMode(null);
			return;
		}

		if (pickerMode === "date") {
			const next = new Date(value);
			next.setFullYear(
				selected.getFullYear(),
				selected.getMonth(),
				selected.getDate(),
			);
			onChange(next);
			if (Platform.OS === "android") {
				// Chain into time picker after date on Android.
				setTimeout(() => setPickerMode("time"), 0);
			}
			return;
		}

		if (pickerMode === "time") {
			const next = new Date(value);
			next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
			onChange(next);
			if (Platform.OS === "android") setPickerMode(null);
		}
	};

	if (Platform.OS === "web") {
		return (
			<View style={styles.container}>
				<Text style={[styles.label, { color: theme.textSecondary }]}>
					Fecha y hora
				</Text>
				<View
					style={[
						styles.row,
						{
							backgroundColor: theme.backgroundElement,
							borderColor: theme.border,
						},
					]}
				>
					{React.createElement("input", {
						type: "datetime-local",
						value: toDatetimeLocalValue(value),
						max: toDatetimeLocalValue(max),
						onChange: (e: { target: { value: string } }) => {
							const raw = e.target.value;
							if (!raw) return;
							const parsed = new Date(raw);
							if (!Number.isNaN(parsed.getTime())) onChange(parsed);
						},
						style: {
							flex: 1,
							border: "none",
							outline: "none",
							backgroundColor: "transparent",
							color: theme.text,
							fontSize: 15,
							fontWeight: "600",
							padding: 0,
						},
					})}
				</View>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Text style={[styles.label, { color: theme.textSecondary }]}>
				Fecha y hora
			</Text>
			<Pressable
				onPress={() => setPickerMode("date")}
				accessibilityRole="button"
				accessibilityLabel={`Fecha y hora: ${label}`}
				style={({ pressed }) => [
					styles.row,
					{
						backgroundColor: theme.backgroundElement,
						borderColor: theme.border,
						opacity: pressed ? 0.7 : 1,
					},
				]}
			>
				<View style={styles.rowLeft}>
					<Ionicons
						name="calendar-outline"
						size={20}
						color={theme.textSecondary}
					/>
					<Text style={[styles.value, { color: theme.text }]}>{label}</Text>
				</View>
				<Ionicons
					name="chevron-forward"
					size={18}
					color={theme.textSecondary}
				/>
			</Pressable>

			{pickerMode ? (
				<DateTimePicker
					value={value}
					mode={pickerMode}
					display={Platform.OS === "ios" ? "spinner" : "default"}
					onChange={applyNativeChange}
					maximumDate={max}
					is24Hour
					locale="es-PE"
				/>
			) : null}

			{Platform.OS === "ios" && pickerMode ? (
				<Pressable
					onPress={() => {
						if (pickerMode === "date") setPickerMode("time");
						else setPickerMode(null);
					}}
					accessibilityRole="button"
					style={({ pressed }) => [
						styles.iosDone,
						{ opacity: pressed ? 0.6 : 1 },
					]}
				>
					<Text style={[styles.iosDoneText, { color: theme.accent }]}>
						{pickerMode === "date" ? "Elegir hora" : "Listo"}
					</Text>
				</Pressable>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		gap: Spacing.two,
	},
	label: {
		fontSize: 13,
		fontWeight: "600",
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderWidth: 1,
		borderRadius: Radius.md,
		paddingHorizontal: Spacing.three,
		paddingVertical: Spacing.three,
	},
	rowLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.two,
		flex: 1,
	},
	value: {
		fontSize: 15,
		fontWeight: "600",
	},
	iosDone: {
		alignSelf: "flex-end",
		paddingVertical: Spacing.two,
		paddingHorizontal: Spacing.one,
	},
	iosDoneText: {
		fontSize: 15,
		fontWeight: "700",
	},
});
