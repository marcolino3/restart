import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

export const GoogleLoginButton = () => {
  return (
    <Button variant="outline" asChild>
      <Link href="http://localhost:3001/api/auth/google">
        Login with Google
      </Link>
    </Button>
  );
};
