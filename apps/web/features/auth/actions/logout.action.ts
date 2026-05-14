import { authClient } from "@/lib/auth-client";

export const logoutAction = async () => {
  await authClient.signOut();
  return { success: true };
};
