import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

type TabBarProps = NonNullable<
  React.ComponentProps<typeof Tabs>["tabBar"]
>;
type TabBarPropsArg = Parameters<TabBarProps>[0];
type TabRoute = TabBarPropsArg["state"]["routes"][number];

type IconName = React.ComponentProps<typeof FontAwesome>["name"];

const ACTIVE_COLOR = "#3a7d44";
const INACTIVE_COLOR = "#837d70";

const tabIcon = (name: IconName) =>
  function TabBarIcon({ color }: { color: string }) {
    return <FontAwesome size={22} name={name} color={color} />;
  };

const TAB_LABELS: Record<string, string> = {
  index: "Heute",
  parent: "Kinder",
  chats: "Chats",
  more: "Mehr",
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
    const Icon = tabIcon(TAB_ICONS[route.name] ?? "circle");

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
        style={{ alignItems: "center", justifyContent: "center", gap: 3 }}
      >
        <Icon color={color} />
        <Text
          style={{
            color,
            fontSize: 10,
            fontWeight: isFocused ? "700" : "600",
          }}
        >
          {TAB_LABELS[route.name] ?? route.name}
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
      {routes.slice(0, 2).map((route) => (
        <View key={route.key} style={{ flex: 1 }}>
          {renderTab(route)}
        </View>
      ))}

      <View style={{ flex: 1, alignItems: "center" }}>
        <Pressable
          onPress={() => router.push("/time-entry")}
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
      <Tabs.Screen name="index" options={{ title: "Heute" }} />
      <Tabs.Screen name="parent" options={{ title: "Kinder" }} />
      <Tabs.Screen name="chats" options={{ title: "Chats" }} />
      <Tabs.Screen name="more" options={{ title: "Mehr" }} />
      <Tabs.Screen
        name="teacher"
        options={{ title: "Classes", href: null }}
      />
      <Tabs.Screen
        name="employee"
        options={{ title: "Time", href: null }}
      />
    </Tabs>
  );
}
