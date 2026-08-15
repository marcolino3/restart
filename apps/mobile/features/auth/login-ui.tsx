/**
 * The login surfaces from the design's screens "0 · Login" and
 * "0b · Organisation": the wordmark, the soft input cards, the accent button
 * and the SSO row.
 */
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

const SOFT = "#837d70";
const ACCENT = "#3a7d44";

/** "R" tile plus the product name. */
export function Wordmark() {
  return (
    <View className="mt-8 flex-row items-center gap-3">
      <View className="h-[42px] w-[42px] items-center justify-center rounded-[13px] bg-primary">
        <Text className="text-lg font-bold text-primary-foreground">R</Text>
      </View>
      <Text className="text-base font-semibold text-foreground">Restart</Text>
    </View>
  );
}

/**
 * A white input card: leading icon, caption above the value, optional trailing
 * element. Focus draws the accent ring the design shows on the active field.
 */
export function LoginField({
  icon,
  caption,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  autoComplete,
  keyboardType,
  onSubmitEditing,
  trailing,
}: {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  caption: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoComplete?: React.ComponentProps<typeof TextInput>["autoComplete"];
  keyboardType?: React.ComponentProps<typeof TextInput>["keyboardType"];
  onSubmitEditing?: () => void;
  trailing?: React.ReactNode;
}) {
  const [focused, setFocused] = React.useState(false);

  return (
    <View
      className={`flex-row items-center gap-3 rounded-[18px] bg-card px-4 py-3.5 shadow-sm shadow-black/5 ${
        focused ? "border-2 border-primary" : ""
      }`}
    >
      <FontAwesome name={icon} size={18} color={SOFT} />
      <View className="flex-1">
        <Text className="text-[11px] font-semibold text-muted-foreground">
          {caption}
        </Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor="#a8a294"
          secureTextEntry={secureTextEntry}
          autoComplete={autoComplete}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          className="mt-px p-0 text-[15px] text-foreground"
        />
      </View>
      {trailing}
    </View>
  );
}

/** The filled accent button of the design, with its coloured shadow. */
export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  className = "",
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      className={`items-center justify-center rounded-[18px] bg-primary p-4 active:opacity-90 ${
        disabled || loading ? "opacity-50" : ""
      } ${className}`}
      style={{
        shadowColor: ACCENT,
        shadowOpacity: 0.34,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 20,
        elevation: 4,
      }}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text className="text-[15px] font-semibold text-primary-foreground">
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/** "oder" between two hairlines. */
export function Separator({ label }: { label: string }) {
  return (
    <View className="my-4 flex-row items-center gap-3.5">
      <View className="h-px flex-1 bg-border" />
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <View className="h-px flex-1 bg-border" />
    </View>
  );
}
