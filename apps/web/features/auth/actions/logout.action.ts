import { authClient } from "@/lib/auth-client";

/**
 * Vollständiger Logout: better-auth-Session UND den separaten `Active-Org`-
 * Cookie abräumen. Letzterer wird NICHT von better-auth verwaltet (backend
 * OrgSwitchController) — ohne Clear würde ein späterer Login den alten Org-/
 * Admin-Kontext erben.
 */
export const logoutAction = async () => {
  // Active-Org-Cookie zuerst leeren (same-origin Proxy, httpOnly-Cookie).
  try {
    await fetch("/api/org/clear", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Ignorieren — Sign-out trotzdem durchführen.
  }
  await authClient.signOut();
  return { success: true };
};
