import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

import { API_BASE_URL } from "./env";

// eslint-disable-next-line no-console
console.log("[auth-client] baseURL:", `${API_BASE_URL}/api/auth`);

export const authClient = createAuthClient({
  baseURL: `${API_BASE_URL}/api/auth`,
  plugins: [
    expoClient({
      scheme: "restart",
      storagePrefix: "restart",
      cookiePrefix: "better-auth",
      storage: SecureStore,
    }),
  ],
});

export const { signIn, signUp, signOut, useSession, getSession, getCookie } =
  authClient;
