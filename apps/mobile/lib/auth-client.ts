import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

import { API_BASE_URL } from "./env";

export const authClient = createAuthClient({
  baseURL: `${API_BASE_URL}/api/auth`,
  plugins: [
    expoClient({
      scheme: "colibri",
      storagePrefix: "colibri",
      storage: SecureStore,
    }),
  ],
});

export const { signIn, signUp, signOut, useSession, getSession, getCookie } =
  authClient;
