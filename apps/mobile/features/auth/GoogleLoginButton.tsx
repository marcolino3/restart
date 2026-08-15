import { ActivityIndicator, Image, Pressable, Text } from "react-native";

// The Google mark in its brand colours, as the design's login screen shows it
// ("Mit Google fortfahren"). Inlined as a data URI so the button needs no SVG
// renderer (react-native-svg is not a dependency) and no asset round-trip.
// The web app's own button uses a monochrome mark; the mobile design does not.
const GOOGLE_MARK = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.63h6.2a5.3 5.3 0 0 1-2.3 3.48v2.89h3.72c2.18-2 3.44-4.96 3.44-8.55"/>
    <path fill="#34A853" d="M12 23.5c3.11 0 5.72-1.03 7.62-2.8l-3.72-2.88c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.02-6.45-4.74H1.71v2.98A11.5 11.5 0 0 0 12 23.5"/>
    <path fill="#FBBC05" d="M5.55 14.18a6.9 6.9 0 0 1 0-4.36V6.84H1.71a11.5 11.5 0 0 0 0 10.32z"/>
    <path fill="#EA4335" d="M12 4.58c1.69 0 3.21.58 4.4 1.72l3.3-3.3C17.71 1.14 15.1 0 12 0A11.5 11.5 0 0 0 1.71 6.84l3.84 2.98C6.46 7.1 9 4.58 12 4.58"/>
  </svg>`,
)}`;

/**
 * Google sign-in button in the design's SSO style: white card, hairline
 * border, brand mark, "Mit Google fortfahren". Shared by both platforms — the
 * login screen differs per platform, this button does not.
 */
export function GoogleLoginButton({
  onPress,
  loading,
  disabled,
  label = "Mit Google fortfahren",
}: {
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
  label?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className="flex-row items-center justify-center gap-3 rounded-[18px] border border-border bg-card p-3.5 active:opacity-80 disabled:opacity-50"
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <>
          <Image
            source={{ uri: GOOGLE_MARK }}
            style={{ width: 19, height: 19 }}
            accessibilityIgnoresInvertColors
          />
          <Text className="text-[14.5px] font-semibold text-foreground">
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
