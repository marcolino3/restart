import { useState } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { GoogleLoginButton } from "@/features/auth/GoogleLoginButton";
import {
  LoginField,
  PrimaryButton,
  Separator,
  Wordmark,
} from "@/features/auth/login-ui";
import { signIn } from "@/lib/auth-client";

/**
 * Web login, in the design's "0 · Login" layout. Mirrors login.tsx minus Apple
 * sign-in: expo-apple-authentication is native-only, and Sign in with Apple on
 * the web is a separate OAuth setup (its own Services ID and return URL) that
 * is not configured. Email/password and Google cover the web flow.
 *
 * Face ID from the design is left out — there is no passkey or biometric flow
 * behind it yet, and a button that does nothing is worse than none.
 *
 * The session arrives as an httpOnly cookie set by the backend — see
 * auth-client.web.ts. Nothing here touches the token.
 */
export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow px-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mx-auto w-full max-w-sm grow">
            <Wordmark />

            <Text className="mt-5 text-[27px] font-semibold leading-tight text-foreground">
              Willkommen{"\n"}zurück.
            </Text>
            <Text className="mt-2 text-[13.5px] leading-5 text-muted-foreground">
              Melde dich an, um deine Zeit zu erfassen und den Schulalltag im
              Blick zu behalten.
            </Text>

            <View className="mt-5 gap-2.5">
              <LoginField
                icon="envelope-o"
                caption="E-Mail"
                value={email}
                onChangeText={setEmail}
                placeholder="du@schule.ch"
                autoComplete="email"
                keyboardType="email-address"
                onSubmitEditing={() => void onEmailSignIn()}
              />

              <LoginField
                icon="lock"
                caption="Passwort"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                autoComplete="password"
                onSubmitEditing={() => void onEmailSignIn()}
                trailing={
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword ? "Passwort verbergen" : "Passwort anzeigen"
                    }
                  >
                    <FontAwesome
                      name={showPassword ? "eye-slash" : "eye"}
                      size={18}
                      color="#837d70"
                    />
                  </Pressable>
                }
              />

              {error ? (
                <Text className="text-sm text-destructive">{error}</Text>
              ) : null}

              <PrimaryButton
                label="Anmelden"
                onPress={() => void onEmailSignIn()}
                loading={loading === "email"}
                disabled={busy || !email || !password}
                className="mt-4"
              />
            </View>

            <Separator label="oder" />

            <GoogleLoginButton
              onPress={() => void onGoogleSignIn()}
              loading={loading === "google"}
              disabled={busy}
            />

            <Text className="mt-auto py-5 text-center text-xs leading-5 text-muted-foreground">
              Mit der Anmeldung akzeptierst du die Nutzungsbedingungen und den
              Datenschutz.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
