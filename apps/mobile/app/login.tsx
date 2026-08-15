import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as AppleAuthentication from "expo-apple-authentication";
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
 * Native login, in the design's "0 · Login" layout. Apple sign-in stays — it
 * exists on native and the design's third SSO slot ("Face ID") has no backend
 * flow behind it, so Apple takes that slot instead of a dead button.
 */
export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        if (signInError)
          throw new Error(signInError.message ?? "Apple sign-in failed");
      } else {
        const { error: signInError } = await signIn.social({
          provider: "apple",
          callbackURL: "/",
        });
        if (signInError)
          throw new Error(signInError.message ?? "Apple sign-in failed");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Apple sign-in failed";
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
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow px-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="grow">
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

            <View className="gap-2.5">
              <GoogleLoginButton
                onPress={() => void onGoogleSignIn()}
                loading={loading === "google"}
                disabled={busy}
              />

              {Platform.OS === "ios" ? (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={
                    AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                  }
                  buttonStyle={
                    AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                  }
                  cornerRadius={18}
                  style={{ width: "100%", height: 52 }}
                  onPress={onAppleSignIn}
                />
              ) : null}
            </View>

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
