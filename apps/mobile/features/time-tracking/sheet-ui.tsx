/**
 * The building blocks of the capture sheet (design screen 4).
 *
 * Every size here is taken from the design's own CSS rather than measured off a
 * screenshot: `.sheet`, `.flabel`, `.fcard`, `.frow2`, `.tot`, `.qk`, `.cats`,
 * `.pick`, `.step` and `.sv` in `design-reference.html`. Layout only — the
 * screen owns all state.
 */
import React from "react";
import { Pressable, Text, View } from "react-native";

import { useColors, withAlpha } from "@/lib/theme";
import { Icon, type IconName } from "./Icon";

/** `.flabel` — the uppercase caption above a group. */
export function FieldLabel({ children }: { children: string }) {
  return (
    <Text className="-mb-1 text-[11.5px] font-semibold uppercase tracking-[0.7px] text-muted-foreground">
      {children}
    </Text>
  );
}

/** `.fcard` — the white card holding the from/to pair. */
export function FieldCard({ children }: { children: React.ReactNode }) {
  return (
    <View className="rounded-row bg-card px-4 py-3.5 shadow-sm shadow-black/5">
      {children}
    </View>
  );
}

/**
 * `.frow2 .fv` — one of the two large times. The active one is drawn in the
 * accent colour with a green rule beneath it.
 */
export function TimeValue({
  caption,
  value,
  active = false,
  onPress,
}: {
  caption: string;
  value: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${caption} ${value}`}
      className="flex-1 items-center"
    >
      <Text className="mb-[3px] text-[11.5px] text-muted-foreground">
        {caption}
      </Text>
      <Text
        className={`font-mono-bold text-[27px] tracking-tighter ${
          active
            ? "border-b-2 border-primary pb-0.5 text-accent-foreground"
            : "text-foreground"
        }`}
      >
        {value}
      </Text>
    </Pressable>
  );
}

/** The `→` between the two times. */
export function TimeArrow() {
  return <Text className="text-[15px] text-muted-foreground">→</Text>;
}

/** `.tot` — the divided footer line of the span card. */
export function CardTotal({ children }: { children: React.ReactNode }) {
  const colors = useColors();

  return (
    <View className="mt-3 flex-row items-center justify-center gap-2 border-t border-border pt-[11px]">
      <Icon name="sum" size={14} color={colors.mutedForeground} />
      {children}
    </View>
  );
}

/** `.qk button` — a quick-choice pill. */
export function QuickPill({
  label,
  active = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      className={`rounded-full px-[13px] py-[7px] ${
        active ? "bg-accent" : "border border-border bg-card"
      }`}
    >
      <Text
        className={`text-[12.5px] font-semibold ${
          active ? "text-accent-foreground" : "text-muted-foreground"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** `.cat` — one tile of the 2×2 activity grid. */
export function CategoryTile({
  icon,
  label,
  active = false,
  onPress,
  disabled = false,
  accessibilityLabel,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
  onPress?: () => void;
  /** Holds the design's slot without offering a control that cannot be saved. */
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      focusable={!disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: active, disabled }}
      style={[
        { opacity: disabled ? 0.35 : 1 },
        active ? { shadowColor: withAlpha(colors.primary, 0.3) } : null,
      ]}
      className={`flex-1 flex-row items-center gap-2.5 rounded-lg px-3 py-[11px] ${
        active ? "bg-primary shadow-sm" : "border border-border bg-card"
      }`}
    >
      <Icon
        name={icon}
        size={17}
        color={active ? colors.primaryForeground : colors.mutedForeground}
      />
      <Text
        numberOfLines={1}
        className={`flex-1 text-[13px] font-semibold ${
          active ? "text-primary-foreground" : "text-foreground"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * `.pick` — a white row: an optional leading icon, a caption over its value,
 * and an optional trailing slot. The design fills those slots differently per
 * row (date has only a trailing calendar, the break row a stepper, the note row
 * only a leading glyph), so both are passed in rather than assumed.
 */
export function PickRow({
  icon,
  caption,
  value,
  children,
  placeholder = false,
  trailing,
  alignTop = false,
  onPress,
  disabled = false,
  accessibilityLabel,
}: {
  icon?: IconName;
  caption: string;
  value?: string;
  /** Replaces the value line, for rows whose value is an input of its own. */
  children?: React.ReactNode;
  /** Renders the value in the design's dimmed placeholder tone. */
  placeholder?: boolean;
  trailing?: React.ReactNode;
  /** The note row aligns its glyph to the first line rather than centring. */
  alignTop?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const colors = useColors();

  const body = (
    <>
      {icon ? (
        <Icon name={icon} size={18} color={colors.mutedForeground} />
      ) : null}
      <View className="flex-1">
        <Text className="text-[11px] font-semibold text-muted-foreground">
          {caption}
        </Text>
        {children ?? (
          <Text
            numberOfLines={1}
            className={`mt-px text-[14.5px] ${
              placeholder ? "font-normal" : "font-medium text-foreground"
            }`}
            style={
              placeholder
                ? { color: withAlpha(colors.mutedForeground, 0.7) }
                : undefined
            }
          >
            {value}
          </Text>
        )}
      </View>
      {trailing}
    </>
  );

  const className = `flex-row gap-3 rounded-[18px] bg-card px-4 py-[13px] shadow-sm shadow-black/5 ${
    alignTop ? "items-start" : "items-center"
  }`;

  // A row without a handler is a container (the break row holds a stepper), so
  // it must not announce itself as a button.
  if (!onPress && !disabled) {
    return <View className={className}>{body}</View>;
  }

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      focusable={!disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${caption}: ${value}`}
      accessibilityState={{ disabled }}
      style={{ opacity: disabled ? 0.35 : 1 }}
      className={className}
    >
      {body}
    </Pressable>
  );
}

/** `.wide` — the full-width outlined button under the day timeline. */
export function WideButton({
  icon,
  label,
  onPress,
  disabled = false,
  accessibilityLabel,
}: {
  icon?: IconName;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      focusable={!disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={{ opacity: disabled ? 0.35 : 1 }}
      className="w-full flex-row items-center justify-center gap-2 rounded-lg border border-border bg-card p-3.5"
    >
      {icon ? <Icon name={icon} size={16} color={colors.foreground} /> : null}
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
    </Pressable>
  );
}

/** `.step` — the −/value/+ control, sized from `.step button` and `.step b`. */
export function Stepper({
  value,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
  canDecrease = true,
  canIncrease = true,
}: {
  value: string;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseLabel: string;
  increaseLabel: string;
  canDecrease?: boolean;
  canIncrease?: boolean;
}) {
  const colors = useColors();

  const button = (
    icon: IconName,
    onPress: () => void,
    label: string,
    enabled: boolean,
  ) => (
    <Pressable
      onPress={enabled ? onPress : undefined}
      disabled={!enabled}
      focusable={enabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled }}
      style={{ width: 30, height: 30, opacity: enabled ? 1 : 0.35 }}
      className="items-center justify-center rounded-full bg-field"
    >
      <Icon name={icon} size={15} color={colors.foreground} strokeWidth={2.4} />
    </Pressable>
  );

  return (
    <View className="flex-row items-center gap-3.5">
      {button("minus", onDecrease, decreaseLabel, canDecrease)}
      <Text className="min-w-[46px] text-center font-mono-bold text-[15px]">
        {value}
      </Text>
      {button("plus", onIncrease, increaseLabel, canIncrease)}
    </View>
  );
}

/** `.sv` — the sheet's footer bar; the primary button takes twice the width. */
export function SheetFooter({
  secondaryLabel,
  onSecondary,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
}: {
  secondaryLabel: string;
  onSecondary: () => void;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
}) {
  const colors = useColors();

  return (
    <View className="flex-row gap-2.5 px-5 pb-[22px] pt-3.5">
      <Pressable
        onPress={onSecondary}
        accessibilityRole="button"
        accessibilityLabel={secondaryLabel}
        className="flex-1 items-center rounded-[18px] border border-border bg-card p-[15px]"
      >
        <Text className="text-[14.5px] font-semibold text-foreground">
          {secondaryLabel}
        </Text>
      </Pressable>
      <Pressable
        onPress={onPrimary}
        disabled={primaryDisabled}
        accessibilityRole="button"
        accessibilityLabel={primaryLabel}
        accessibilityState={{ disabled: primaryDisabled }}
        style={{
          flex: 2,
          opacity: primaryDisabled ? 0.5 : 1,
          shadowColor: withAlpha(colors.primary, 0.3),
        }}
        className="items-center rounded-[18px] bg-primary p-[15px] shadow-lg"
      >
        <Text className="text-[14.5px] font-semibold text-primary-foreground">
          {primaryLabel}
        </Text>
      </Pressable>
    </View>
  );
}

/**
 * `.sheet .sh-h` — the sheet header: a 38px round button either side, the title
 * centred between them, the confirm one filled with the accent.
 */
export function SheetHeader({
  title,
  onClose,
  closeLabel,
  onConfirm,
  confirmLabel,
  confirmDisabled = false,
}: {
  title: string;
  onClose: () => void;
  closeLabel: string;
  onConfirm: () => void;
  confirmLabel: string;
  confirmDisabled?: boolean;
}) {
  const colors = useColors();

  return (
    <View className="flex-row items-center gap-3 px-5 pb-3.5 pt-3">
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={closeLabel}
        style={{ width: 38, height: 38 }}
        className="items-center justify-center rounded-full bg-card shadow-sm shadow-black/5"
      >
        <Icon name="x" size={18} color={colors.foreground} />
      </Pressable>
      <Text
        numberOfLines={1}
        className="flex-1 text-center text-[17px] font-semibold tracking-tight text-foreground"
      >
        {title}
      </Text>
      <Pressable
        onPress={onConfirm}
        disabled={confirmDisabled}
        accessibilityRole="button"
        accessibilityLabel={confirmLabel}
        accessibilityState={{ disabled: confirmDisabled }}
        style={{ width: 38, height: 38, opacity: confirmDisabled ? 0.5 : 1 }}
        className="items-center justify-center rounded-full bg-primary"
      >
        <Icon
          name="check"
          size={18}
          color={colors.primaryForeground}
          strokeWidth={2.6}
        />
      </Pressable>
    </View>
  );
}
