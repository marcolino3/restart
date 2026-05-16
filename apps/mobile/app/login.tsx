import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { signIn } from "@/lib/auth-client";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    const { error: signInError } = await signIn.email({ email, password });
    setLoading(false);
    if (signInError) setError(signInError.message ?? "Login failed");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <Text className="mb-2 text-3xl font-bold text-foreground">
            Colibri
          </Text>
          <Text className="mb-8 text-muted-foreground">
            Sign in to your school
          </Text>

          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-foreground">
              Email
            </Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              className="rounded-md border border-border bg-background px-4 py-3 text-foreground"
              placeholder="you@school.ch"
              placeholderTextColor="#999"
            />
          </View>

          <View className="mb-6">
            <Text className="mb-2 text-sm font-medium text-foreground">
              Password
            </Text>
            <TextInput
              secureTextEntry
              autoComplete="password"
              value={password}
              onChangeText={setPassword}
              className="rounded-md border border-border bg-background px-4 py-3 text-foreground"
              placeholder="••••••••"
              placeholderTextColor="#999"
            />
          </View>

          {error ? (
            <Text className="mb-4 text-sm text-destructive">{error}</Text>
          ) : null}

          <Pressable
            onPress={onSubmit}
            disabled={loading || !email || !password}
            className="rounded-md bg-primary py-3 active:opacity-80 disabled:opacity-50"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-center font-medium text-primary-foreground">
                Sign in
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
