import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { t } from "@/lib/i18n";

type TabBarProps = NonNullable<
  React.ComponentProps<typeof Tabs>["tabBar"]
>;
type TabBarPropsArg = Parameters<TabBarProps>[0];
type TabRoute = TabBarPropsArg["state"]["routes"][number];

type IconName = React.ComponentProps<typeof FontAwesome>["name"];

const ACTIVE_COLOR = "#3a7d44";
const INACTIVE_COLOR = "#837d70";

function TabBarIcon({ name, color }: { name: IconName; color: string }) {
  return <FontAwesome size={22} name={name} color={color} />;
}

const TAB_LABEL_KEYS: Record<string, string> = {
  index: "MobileNav.tabToday",
  parent: "MobileNav.tabChildren",
  chats: "MobileNav.tabChats",
  more: "MobileNav.tabMore",
};

const TAB_ICONS: Record<string, IconName> = {
  index: "home",
  parent: "child",
  chats: "comments",
  more: "th-large",
};

const VISIBLE_TAB_NAMES = ["index", "parent", "chats", "more"];

function FabTabBar({ state, navigation }: TabBarPropsArg) {
  const router = useRouter();
  const routes = state.routes.filter((route) =>
    VISIBLE_TAB_NAMES.includes(route.name),
  );

  const renderTab = (route: TabRoute) => {
    const routeIndex = state.routes.findIndex((r) => r.key === route.key);
    const isFocused = state.index === routeIndex;
    const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;
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
        style={{ alignItems: "center", justifyContent: "center", gap: 3 }}
      >
        <TabBarIcon name={TAB_ICONS[route.name] ?? "circle"} color={color} />
        <Text
          style={{
            color,
            fontSize: 10,
            fontWeight: isFocused ? "700" : "600",
          }}
        >
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
        left: 18,
        right: 18,
        bottom: 16,
        height: 62,
        paddingHorizontal: 6,
        backgroundColor: "rgba(255,255,255,0.88)",
        borderWidth: 1,
        borderColor: "rgba(25,20,10,0.08)",
        borderRadius: 999,
        flexDirection: "row",
        alignItems: "center",
        elevation: 8,
        shadowColor: "#19140a",
        shadowOpacity: 0.22,
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 30,
      }}
    >
      {routes.slice(0, Math.ceil(routes.length / 2)).map((route) => (
        <View key={route.key} style={{ flex: 1 }}>
          {renderTab(route)}
        </View>
      ))}

      <View style={{ flex: 1, alignItems: "center" }}>
        <Pressable
          onPress={() => router.push("/time-entry")}
          accessibilityRole="button"
          accessibilityLabel={t("MobileNav.moreTimeTracking")}
          style={{
            width: 48,
            height: 48,
            marginTop: -2,
            borderRadius: 999,
            backgroundColor: ACTIVE_COLOR,
            alignItems: "center",
            justifyContent: "center",
            elevation: 4,
            shadowColor: ACTIVE_COLOR,
            shadowOpacity: 0.3,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 8,
          }}
        >
          <FontAwesome name="plus" size={24} color="#ffffff" />
        </Pressable>
      </View>

      {routes.slice(Math.ceil(routes.length / 2)).map((route) => (
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
      <Tabs.Screen name="index" options={{ title: t("MobileNav.tabToday") }} />
      <Tabs.Screen
        name="parent"
        options={{ title: t("MobileNav.tabChildren") }}
      />
      <Tabs.Screen name="chats" options={{ title: t("MobileNav.tabChats") }} />
      <Tabs.Screen name="more" options={{ title: t("MobileNav.tabMore") }} />
      <Tabs.Screen
        name="teacher"
        options={{ title: t("MobileNav.moreClasses"), href: null }}
      />
      <Tabs.Screen
        name="employee"
        options={{ title: t("MobileNav.moreTimeTracking"), href: null }}
      />
    </Tabs>
  );
}
