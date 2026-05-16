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
import * as AppleAuthentication from "expo-apple-authentication";

import { signIn } from "@/lib/auth-client";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<"email" | "google" | "apple" | null>(
    null,
  );
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
    const { error: signInError } = await signIn.social({
      provider: "google",
      callbackURL: "/",
    });
    setLoading(null);
    if (signInError) setError(signInError.message ?? "Google sign-in failed");
  };

  const onAppleSignIn = async () => {
    setError(null);
    setLoading("apple");
    try {
      if (Platform.OS === "ios") {
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });
        if (!credential.identityToken) {
          throw new Error("Apple did not return an identity token");
        }
        const { error: signInError } = await signIn.social({
          provider: "apple",
          idToken: {
            token: credential.identityToken,
          },
          callbackURL: "/",
        });
        if (signInError) throw new Error(signInError.message ?? "Apple sign-in failed");
      } else {
        const { error: signInError } = await signIn.social({
          provider: "apple",
          callbackURL: "/",
        });
        if (signInError) throw new Error(signInError.message ?? "Apple sign-in failed");
      }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Apple sign-in failed";
      if (!message.includes("ERR_REQUEST_CANCELED")) setError(message);
    } finally {
      setLoading(null);
    }
  };

  const busy = loading !== null;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <Text className="mb-2 text-3xl font-bold text-foreground">
            Restart
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
            onPress={onEmailSignIn}
            disabled={busy || !email || !password}
            className="rounded-md bg-primary py-3 active:opacity-80 disabled:opacity-50"
          >
            {loading === "email" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-center font-medium text-primary-foreground">
                Sign in
              </Text>
            )}
          </Pressable>

          <View className="my-6 flex-row items-center">
            <View className="h-px flex-1 bg-border" />
            <Text className="mx-3 text-xs text-muted-foreground">OR</Text>
            <View className="h-px flex-1 bg-border" />
          </View>

          <Pressable
            onPress={onGoogleSignIn}
            disabled={busy}
            className="mb-3 flex-row items-center justify-center rounded-md border border-border bg-background py-3 active:opacity-80 disabled:opacity-50"
          >
            {loading === "google" ? (
              <ActivityIndicator />
            ) : (
              <Text className="font-medium text-foreground">
                Continue with Google
              </Text>
            )}
          </Pressable>

          {Platform.OS === "ios" ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={
                AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
              }
              buttonStyle={
                AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
              }
              cornerRadius={6}
              style={{ width: "100%", height: 48 }}
              onPress={onAppleSignIn}
            />
          ) : (
            <Pressable
              onPress={onAppleSignIn}
              disabled={busy}
              className="rounded-md border border-border bg-background py-3 active:opacity-80 disabled:opacity-50"
            >
              {loading === "apple" ? (
                <ActivityIndicator />
              ) : (
                <Text className="text-center font-medium text-foreground">
                  Continue with Apple
                </Text>
              )}
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
