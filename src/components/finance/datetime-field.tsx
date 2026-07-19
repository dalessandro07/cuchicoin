import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
	type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
	applyPickerDate,
	applyPickerTime,
	formatLimaDateTime,
	limaLocalToDate,
	toPickerLocalDate,
} from "@/lib/peru-datetime";

export type DateTimeFieldProps = {
	value: Date;
	onChange: (next: Date) => void;
	/** Maximum selectable date (defaults to now). */
	maximumDate?: Date;
};

type PickerMode = "date" | "time" | null;

function toDatetimeLocalValue(date: Date): string {
	const picker = toPickerLocalDate(date);
	const y = picker.getFullYear();
	const m = String(picker.getMonth() + 1).padStart(2, "0");
	const d = String(picker.getDate()).padStart(2, "0");
	const hh = String(picker.getHours()).padStart(2, "0");
	const mm = String(picker.getMinutes()).padStart(2, "0");
	return `${y}-${m}-${d}T${hh}:${mm}`;
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
	// Show Lima wall-clock in the native picker even if device TZ ≠ Peru.
	const pickerValue = toPickerLocalDate(value);
	const pickerMax = toPickerLocalDate(max);

	const applyNativeChange = (event: DateTimePickerEvent, selected?: Date) => {
		if (Platform.OS === "android") {
			setPickerMode(null);
		}
		if (event.type === "dismissed" || !selected) {
			if (Platform.OS === "ios") setPickerMode(null);
			return;
		}

		if (pickerMode === "date") {
			onChange(applyPickerDate(value, selected));
			if (Platform.OS === "android") {
				setTimeout(() => setPickerMode("time"), 0);
			}
			return;
		}

		if (pickerMode === "time") {
			onChange(applyPickerTime(value, selected));
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
							const [datePart, timePart] = raw.split("T");
							if (!datePart || !timePart) return;
							const next = limaLocalToDate(datePart, timePart);
							if (next) onChange(next);
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
					value={pickerValue}
					mode={pickerMode}
					display={Platform.OS === "ios" ? "spinner" : "default"}
					onChange={applyNativeChange}
					maximumDate={pickerMax}
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
