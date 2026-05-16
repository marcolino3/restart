import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { signOut, useSession } from "@/lib/auth-client";

export default function HomeScreen() {
  const { data: session } = useSession();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-6">
        <Text className="text-2xl font-bold text-foreground">Welcome</Text>
        {session?.user?.email ? (
          <Text className="mt-2 text-muted-foreground">
            Signed in as {session.user.email}
          </Text>
        ) : null}

        <Pressable
          onPress={() => signOut()}
          className="mt-8 self-start rounded-md border border-border px-4 py-2"
        >
          <Text className="text-foreground">Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
