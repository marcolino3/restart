import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { signOut } from "@/lib/auth-client";
import { setActiveOrg } from "@/lib/gql-client";

export default function MoreTab() {
  const router = useRouter();

  const handleSignOut = async () => {
    setActiveOrg(null);
    await signOut({
      fetchOptions: {
        onSuccess: () => router.replace("/login"),
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 gap-2 p-6">
        <Text className="text-2xl font-bold text-foreground">Mehr</Text>

        <Pressable
          className="mt-4 rounded-xl border border-border p-4"
          onPress={() => router.push("/(tabs)/employee")}
        >
          <Text className="font-semibold text-foreground">
            Zeiterfassung
          </Text>
        </Pressable>

        <Pressable
          className="rounded-xl border border-border p-4"
          onPress={() => router.push("/(tabs)/teacher")}
        >
          <Text className="font-semibold text-foreground">Klassen</Text>
        </Pressable>

        <Pressable
          className="mt-4 rounded-xl border border-border p-4"
          onPress={handleSignOut}
        >
          <Text className="font-semibold text-destructive">Abmelden</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
