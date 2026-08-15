import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GoogleLoginButton } from "@/features/auth/GoogleLoginButton";
import { signIn } from "@/lib/auth-client";

/**
 * Web login. Mirrors login.tsx minus Apple sign-in: expo-apple-authentication
 * is native-only, and Sign in with Apple on the web is a separate OAuth setup
 * (its own Services ID and return URL) that is not configured. Email/password
 * and Google cover the web flow.
 *
 * The session arrives as an httpOnly cookie set by the backend — see
 * auth-client.web.ts. Nothing here touches the token.
 */
export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onEmailSignIn = async () => {
    setError(null);
    setLoading("email");
    const { error: signInError } = await signIn.email({ email, password });
    setLoading(null);
    if (signInError) setError(signInError.message ?? "Login failed");
  };

  const onGoogleSignIn = async () => {
    setError(null);
    setLoading("google");
    // Full-page redirect to Google and back to the backend callback, which
    // then returns here. Keep loading set: on success this frame is replaced,
    // and only an error path ever resumes it.
    const { error: signInError } = await signIn.social({
      provider: "google",
      callbackURL: window.location.origin,
      errorCallbackURL: `${window.location.origin}/login`,
    });
    if (signInError) {
      setLoading(null);
      setError(signInError.message ?? "Google sign-in failed");
    }
  };

  const busy = loading !== null;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView className="flex-1">
        <View className="flex-1 justify-center px-6">
          <View className="mx-auto w-full max-w-sm">
            <Text className="mb-2 text-3xl font-bold text-foreground">
              Restart
            </Text>
            <Text className="mb-8 text-muted-foreground">
              Bei deiner Schule anmelden
            </Text>

            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-foreground">
                E-Mail
              </Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                onSubmitEditing={() => void onEmailSignIn()}
                className="rounded-md border border-border bg-background px-4 py-3 text-foreground"
                placeholder="du@schule.ch"
                placeholderTextColor="#837d70"
              />
            </View>

            <View className="mb-6">
              <Text className="mb-2 text-sm font-medium text-foreground">
                Passwort
              </Text>
              <TextInput
                secureTextEntry
                autoComplete="password"
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={() => void onEmailSignIn()}
                className="rounded-md border border-border bg-background px-4 py-3 text-foreground"
                placeholder="••••••••"
                placeholderTextColor="#837d70"
              />
            </View>

            {error ? (
              <Text className="mb-4 text-sm text-destructive">{error}</Text>
            ) : null}

            <Pressable
              onPress={onEmailSignIn}
              disabled={busy || !email || !password}
              accessibilityRole="button"
              className="h-12 items-center justify-center rounded-md bg-primary active:opacity-80 disabled:opacity-50"
            >
              {loading === "email" ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-center font-medium text-primary-foreground">
                  Anmelden
                </Text>
              )}
            </Pressable>

            <View className="my-6 flex-row items-center">
              <View className="h-px flex-1 bg-border" />
              <Text className="mx-3 text-xs text-muted-foreground">ODER</Text>
              <View className="h-px flex-1 bg-border" />
            </View>

            <GoogleLoginButton
              onPress={onGoogleSignIn}
              loading={loading === "google"}
              disabled={busy}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
