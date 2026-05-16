import Constants from "expo-constants";
import { Platform } from "react-native";

const fromEnv =
  (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env?.EXPO_PUBLIC_API_URL;

const devFallback = () => {
  if (Platform.OS === "android") return "http://10.0.2.2:4001";
  const debuggerHost = Constants.expoConfig?.hostUri?.split(":")?.[0];
  if (debuggerHost) return `http://${debuggerHost}:4001`;
  return "http://localhost:4001";
};

export const API_BASE_URL = fromEnv ?? devFallback();
