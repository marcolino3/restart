import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Platform, Pressable, Text, View } from "react-native";

import { i18n, t } from "@/lib/i18n";

type Props = {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  /** Shows a clear action and renders a placeholder when no value is set. */
  optional?: boolean;
  error?: string;
  disabled?: boolean;
};

const formatDate = (d: Date) =>
  d.toLocaleDateString(i18n.locale === "de" ? "de-CH" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

/**
 * Native date picker. iOS renders the compact system control inline; Android
 * opens the platform dialog on tap. Works with a nullable value so optional
 * dates (end of a range) can be left empty or cleared.
 */
export function DateField({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
  optional = false,
  error,
  disabled = false,
}: Props) {
  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === "dismissed") return;
    if (date) onChange(date);
  };

  const openAndroid = () => {
    DateTimePickerAndroid.open({
      value: value ?? minimumDate ?? new Date(),
      mode: "date",
      minimumDate,
      maximumDate,
      onChange: handleChange,
    });
  };

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-foreground">{label}</Text>
      <View
        className={`flex-row items-center justify-between rounded-md border bg-background px-3 py-2 ${
          error ? "border-destructive" : "border-border"
        } ${disabled ? "opacity-60" : ""}`}
      >
        {Platform.OS === "ios" && value ? (
          <DateTimePicker
            value={value}
            mode="date"
            display="compact"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onChange={handleChange}
            disabled={disabled}
          />
        ) : (
          <Pressable
            disabled={disabled}
            onPress={
              Platform.OS === "ios"
                ? () => onChange(minimumDate ?? new Date())
                : openAndroid
            }
            className="flex-1 py-1"
            accessibilityRole="button"
            accessibilityLabel={label}
          >
            <Text
              className={`text-base ${
                value ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {value ? formatDate(value) : t("Common.selectDate")}
            </Text>
          </Pressable>
        )}
        {optional && value && !disabled ? (
          <Pressable onPress={() => onChange(null)} hitSlop={8}>
            <Text className="text-sm text-muted-foreground">
              {t("Common.clearDate")}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
    </View>
  );
}
