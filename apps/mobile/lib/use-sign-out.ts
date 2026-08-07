import { useState } from "react";
import { useRouter } from "expo-router";

import { signOut } from "@/lib/auth-client";
import { setActiveOrg } from "@/lib/gql-client";

export function useSignOut() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    // Reset the active-org singleton so a stale org can't leak into the next
    // session (this is what caused "No active session/membership" after a
    // re-login as a different user). Then await the sign-out and only redirect
    // on success — navigating without await races the session store to null.
    setActiveOrg(null);
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => router.replace("/login"),
        },
      });
    } finally {
      setSigningOut(false);
    }
  };

  return { handleSignOut, signingOut };
}
