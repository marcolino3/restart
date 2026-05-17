"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MagicLinkLoginForm } from "./MagicLinkLoginForm";
import { Separator } from "@/components/ui/separator";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { AppleLoginButton } from "./AppleLoginButton";

export const LoginCard = () => {
  const t = useTranslations("Auth");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("login")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-5">
        <MagicLinkLoginForm />
        <Separator />
        <GoogleLoginButton />
        <AppleLoginButton />
      </CardContent>
    </Card>
  );
};
