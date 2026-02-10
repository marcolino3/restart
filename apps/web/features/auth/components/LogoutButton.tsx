"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"; // shadcn
import { logoutAction } from "../actions/logout.action";

export const LogoutButton = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      onClick={() => {
        startTransition(async () => {
          await logoutAction();
          router.replace("/sign-in"); // oder beliebige Seite
        });
      }}
      disabled={isPending}
    >
      {isPending ? "Logging out..." : "Logout"}
    </Button>
  );
};
