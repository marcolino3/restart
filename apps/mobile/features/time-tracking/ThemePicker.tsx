/**
 * The palette picker: one round swatch per theme, drawn in that theme's own
 * accent so the choice reads without a label. The selected one carries a ring
 * and its accent-coloured check.
 */
import React from "react";
import { Pressable, ScrollView, View } from "react-native";

import { useTheme } from "@/lib/theme";
import { THEMES, THEME_LABELS, THEME_NAMES } from "@/lib/themes";
import { Icon } from "./Icon";

export function ThemePicker() {
  const { theme, setTheme } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12, paddingVertical: 2 }}
    >
      {THEME_NAMES.map((name) => {
        const palette = THEMES[name];
        const selected = name === theme;
        return (
          <Pressable
            key={name}
            onPress={() => setTheme(name)}
            accessibilityRole="radio"
            accessibilityLabel={THEME_LABELS[name]}
            accessibilityState={{ selected }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: palette["--primary"],
              // The ring is drawn in the theme's own background so it reads as
              // a gap between swatch and outline, as the design does.
              borderWidth: selected ? 3 : 0,
              borderColor: palette["--background"],
            }}
          >
            {selected ? (
              <Icon
                name="check"
                size={20}
                color={palette["--primary-foreground"]}
                strokeWidth={2.6}
              />
            ) : null}
            {selected ? (
              <View
                style={{
                  position: "absolute",
                  inset: -6,
                  borderRadius: 999,
                  borderWidth: 2,
                  borderColor: palette["--primary"],
                }}
              />
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
