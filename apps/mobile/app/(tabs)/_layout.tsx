/**
 * The floating tabbar from `features/time-tracking/design-reference.html`:
 * a white panel card with five slots, the middle one a raised accent button
 * that starts a time entry.
 */
import React from "react";
import { Tabs, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { Icon, type IconName } from "@/features/time-tracking/Icon";
import { useColors } from "@/lib/theme";
import { t } from "@/lib/i18n";

type TabBarProps = NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>;
type TabBarPropsArg = Parameters<TabBarProps>[0];
type TabRoute = TabBarPropsArg["state"]["routes"][number];


const TAB_LABEL_KEYS: Record<string, string> = {
  employee: "MobileNav.tabToday",
  history: "MobileNav.tabHistory",
  absences: "MobileNav.tabAbsences",
  more: "MobileNav.tabMore",
};

const TAB_ICONS: Record<string, IconName> = {
  employee: "clock",
  history: "calendar",
  absences: "calendarOff",
  more: "more",
};

/** The four slots around the stamp button, in the design's order. */
const VISIBLE_TAB_NAMES = ["employee", "history", "absences", "more"];

function FabTabBar({ state, navigation }: TabBarPropsArg) {
  const router = useRouter();
  const colors = useColors();
  const routes = VISIBLE_TAB_NAMES.map((name) =>
    state.routes.find((route) => route.name === name),
  ).filter((route): route is TabRoute => Boolean(route));

  const renderTab = (route: TabRoute) => {
    const routeIndex = state.routes.findIndex((r) => r.key === route.key);
    const isFocused = state.index === routeIndex;
    const color = isFocused ? colors.foreground : colors.mutedForeground;
    const label = TAB_LABEL_KEYS[route.name]
      ? t(TAB_LABEL_KEYS[route.name])
      : route.name;

    return (
      <Pressable
        key={route.key}
        onPress={() => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }}
        accessibilityRole="tab"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={label}
        style={{ alignItems: "center", justifyContent: "center", gap: 5 }}
      >
        <Icon
          size={21}
          name={TAB_ICONS[route.name] ?? "more"}
          color={isFocused ? colors.primary : colors.mutedForeground}
        />
        <Text style={{ color, fontSize: 10.5, fontWeight: "600" }}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 14,
        height: 68,
        paddingHorizontal: 6,
        backgroundColor: colors.card,
        borderRadius: 26,
        flexDirection: "row",
        alignItems: "center",
        elevation: 8,
        shadowColor: "#1e1e19",
        shadowOpacity: 0.14,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 28,
      }}
    >
      {routes.slice(0, 2).map((route) => (
        <View key={route.key} style={{ flex: 1 }}>
          {renderTab(route)}
        </View>
      ))}

      <View style={{ flex: 1, alignItems: "center" }}>
        <Pressable
          onPress={() => router.push("/capture-time")}
          accessibilityRole="button"
          accessibilityLabel={t("TimeTracking.captureWorkTime")}
          style={{
            width: 62,
            height: 62,
            // Lifted out of the bar, with a panel-coloured ring around it.
            marginTop: -26,
            borderRadius: 999,
            borderWidth: 5,
            borderColor: colors.card,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            elevation: 6,
            shadowColor: colors.primary,
            shadowOpacity: 0.42,
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 20,
          }}
        >
          <Icon name="fingerprint" size={26} color={colors.primaryForeground} />
        </Pressable>
      </View>

      {routes.slice(2).map((route) => (
        <View key={route.key} style={{ flex: 1 }}>
          {renderTab(route)}
        </View>
      ))}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FabTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="employee"
        options={{ title: t("MobileNav.tabToday") }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: t("MobileNav.tabHistory") }}
      />
      <Tabs.Screen
        name="absences"
        options={{ title: t("MobileNav.tabAbsences") }}
      />
      <Tabs.Screen name="more" options={{ title: t("MobileNav.tabMore") }} />
      {/* Reachable from "Mehr", not a slot of its own — the design has four. */}
      <Tabs.Screen
        name="chats"
        options={{ title: t("MobileNav.tabChats"), href: null }}
      />
      {/* Forwards to "Heute"; never a slot of its own. */}
      <Tabs.Screen
        name="index"
        options={{ title: t("MobileNav.tabToday"), href: null }}
      />
    </Tabs>
  );
}
