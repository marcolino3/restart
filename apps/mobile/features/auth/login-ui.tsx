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
import { Icon, type IconName } from "@/features/time-tracking/Icon";
import { useColors } from "@/lib/theme";


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
  icon: IconName;
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
  const colors = useColors();
  const [focused, setFocused] = React.useState(false);

  return (
    <View
      // The border is always present, only its colour changes: a border that
      // appears on focus would shift the contents by its own width.
      className={`flex-row items-center gap-3 rounded-[18px] border-2 bg-card px-4 py-[13px] shadow-sm shadow-black/5 ${
        focused ? "border-primary" : "border-transparent"
      }`}
    >
      <Icon name={icon} size={18} color={colors.mutedForeground} />
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
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry={secureTextEntry}
          autoComplete={autoComplete}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          className="mt-px p-0 text-[15px] font-medium text-foreground"
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
  const colors = useColors();

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
        shadowColor: colors.primary,
        shadowOpacity: 0.34,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 20,
        elevation: 4,
      }}
    >
      {loading ? (
        <ActivityIndicator color={colors.primaryForeground} />
      ) : (
        <Text className="text-[15px] font-semibold text-primary-foreground">
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/**
 * `.orgpick` — one organization to choose from: a square initials tile, the
 * role over the name, and a chevron. `active` renders the filled accent variant
 * the design gives the currently selected org.
 */
export function OrgRow({
  initials,
  caption,
  name,
  active = false,
  onPress,
}: {
  initials: string;
  caption: string;
  name: string;
  active?: boolean;
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${caption}: ${name}`}
      accessibilityState={{ selected: active }}
      className={`flex-row items-center gap-[11px] rounded-[18px] px-[15px] py-3 ${
        active ? "bg-accent" : "bg-card shadow-sm shadow-black/5"
      }`}
    >
      <View
        className={`h-[34px] w-[34px] items-center justify-center rounded-[11px] ${
          active ? "bg-primary" : "bg-field"
        }`}
      >
        <Text
          className={`text-[12.5px] font-bold ${
            active ? "text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          {initials}
        </Text>
      </View>
      <View className="flex-1">
        <Text
          className={`text-[11px] font-semibold ${
            active ? "text-accent-foreground" : "text-muted-foreground"
          }`}
        >
          {caption}
        </Text>
        <Text
          numberOfLines={1}
          className="mt-px text-sm font-semibold text-foreground"
        >
          {name}
        </Text>
      </View>
      <Icon
        name="right"
        size={16}
        color={active ? colors.accentForeground : colors.mutedForeground}
      />
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
