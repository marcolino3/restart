import Constants from "expo-constants";
import { Platform } from "react-native";

const fromEnv =
  (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env?.EXPO_PUBLIC_API_URL;

const devFallback = () => {
  // Android emulator: host loopback is 10.0.2.2
  if (Platform.OS === "android") return "http://10.0.2.2:4001";
  // iOS Simulator: localhost maps to host. Physical iOS device must set
  // EXPO_PUBLIC_API_URL to the host's LAN IP.
  if (Platform.OS === "ios") return "http://localhost:4001";
  // Web (expo --web): same origin handles itself; fall back to hostUri for
  // dev tooling completeness.
  const debuggerHost = Constants.expoConfig?.hostUri?.split(":")?.[0];
  if (debuggerHost) return `http://${debuggerHost}:4001`;
  return "http://localhost:4001";
};

export const API_BASE_URL = fromEnv ?? devFallback();
