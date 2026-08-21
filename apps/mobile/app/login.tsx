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
 * Native login, in the design's "0 · Login" layout. Apple sign-in stays — it
 * exists on native and the design's third SSO slot ("Face ID") has no backend
 * flow behind it, so Apple takes that slot instead of a dead button.
 */
export default function LoginScreen() {
  const colors = useColors();
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
    if (signInError)
      setError(signInError.message ?? t("Auth.signInError"));
  };

  const onGoogleSignIn = async () => {
    setError(null);
    setLoading("google");
    const { error: signInError } = await signIn.social({
      provider: "google",
      callbackURL: "/",
    });
    setLoading(null);
    if (signInError)
      setError(signInError.message ?? t("Auth.googleSignInError"));
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
          throw new Error(t("Auth.appleNoIdentityToken"));
        }
        const { error: signInError } = await signIn.social({
          provider: "apple",
          idToken: {
            token: credential.identityToken,
          },
          callbackURL: "/",
        });
        if (signInError)
          throw new Error(signInError.message ?? t("Auth.appleSignInError"));
      } else {
        const { error: signInError } = await signIn.social({
          provider: "apple",
          callbackURL: "/",
        });
        if (signInError)
          throw new Error(signInError.message ?? t("Auth.appleSignInError"));
      }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : t("Auth.appleSignInError");
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
                    {/*
                     * The design has one eye glyph, no struck-through variant,
                     * so the state shows as accent vs. muted; the button's
                     * label still announces which action it performs.
                     */}
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
              {t("Auth.mobileTerms")}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
