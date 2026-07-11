import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { signOut, useSession } from "@/lib/auth-client";
import { setActiveOrg } from "@/lib/gql-client";

export default function HomeScreen() {
  const { data: session } = useSession();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    // Reset the active-org singleton so a stale org can't leak into the next
    // session (this is what caused "No active session/membership" after a
    // re-login as a different user). Then await the sign-out and only redirect
    // on success — navigating without await races the session store to null.
    setActiveOrg(null);
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => router.replace("/login"),
        },
      });
    } finally {
      setSigningOut(false);
    }
  };

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
          onPress={() => void handleSignOut()}
          disabled={signingOut}
          className="mt-8 self-start rounded-md border border-border px-4 py-2"
        >
          <Text className="text-foreground">Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
