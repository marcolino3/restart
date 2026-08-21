import { useState } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/features/time-tracking/Icon";
import { useColors } from "@/lib/theme";

import { GoogleLoginButton } from "@/features/auth/GoogleLoginButton";
import {
  LoginField,
  PrimaryButton,
  Separator,
  Wordmark,
} from "@/features/auth/login-ui";
import { signIn } from "@/lib/auth-client";
import { t } from "@/lib/i18n";

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
  const colors = useColors();
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
    if (signInError)
      setError(signInError.message ?? t("Auth.signInError"));
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
      setError(signInError.message ?? t("Auth.googleSignInError"));
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
              {t("Auth.welcomeBack")}
            </Text>
            <Text className="mt-2 text-[13.5px] leading-5 text-muted-foreground">
              {t("Auth.mobileLoginSubtitle")}
            </Text>

            <View className="mt-5 gap-2.5">
              <LoginField
                icon="mail"
                caption={t("Auth.email")}
                value={email}
                onChangeText={setEmail}
                placeholder={t("Auth.mobileEmailPlaceholder")}
                autoComplete="email"
                keyboardType="email-address"
                onSubmitEditing={() => void onEmailSignIn()}
              />

              <LoginField
                icon="lock"
                caption={t("Auth.password")}
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
                      showPassword
                        ? t("Auth.hidePassword")
                        : t("Auth.showPassword")
                    }
                  >
                    <Icon
                      name="eye"
                      size={18}
                      color={
                        showPassword
                          ? colors.primary
                          : colors.mutedForeground
                      }
                    />
                  </Pressable>
                }
              />

              {error ? (
                <Text className="text-sm text-destructive">{error}</Text>
              ) : null}

              <PrimaryButton
                label={t("Auth.signIn")}
                onPress={() => void onEmailSignIn()}
                loading={loading === "email"}
                disabled={busy || !email || !password}
                className="mt-4"
              />
            </View>

            <Separator label={t("Auth.or")} />

            <GoogleLoginButton
              onPress={() => void onGoogleSignIn()}
              loading={loading === "google"}
              disabled={busy}
            />

            <Text className="mt-auto py-5 text-center text-xs leading-5 text-muted-foreground">
              {t("Auth.mobileTerms")}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
