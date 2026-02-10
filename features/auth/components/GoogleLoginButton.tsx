import { Button } from "@/components/ui/button";
import { GOOGLE_LOGIN_API } from "@/constants/google-login-api";
import Link from "next/link";
import React from "react";

export const GoogleLoginButton = () => {
  return (
    <Button variant="outline" asChild>
      <Link href={GOOGLE_LOGIN_API}>
        Login with Google
      </Link>
    </Button>
  );
};
