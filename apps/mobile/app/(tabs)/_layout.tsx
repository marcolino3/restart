import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

type IconName = React.ComponentProps<typeof FontAwesome>["name"];

const tabIcon = (name: IconName) =>
  function TabBarIcon({ color }: { color: string }) {
    return <FontAwesome size={24} style={{ marginBottom: -3 }} name={name} color={color} />;
  };

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: tabIcon("home") }}
      />
      <Tabs.Screen
        name="chats"
        options={{ title: "Chats", tabBarIcon: tabIcon("comments") }}
      />
      <Tabs.Screen
        name="employee"
        options={{ title: "Time", tabBarIcon: tabIcon("clock-o") }}
      />
      <Tabs.Screen
        name="teacher"
        options={{ title: "Classes", tabBarIcon: tabIcon("book") }}
      />
      <Tabs.Screen
        name="parent"
        options={{ title: "Children", tabBarIcon: tabIcon("child") }}
      />
    </Tabs>
  );
}
