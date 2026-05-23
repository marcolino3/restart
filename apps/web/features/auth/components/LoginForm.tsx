"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { EmailPasswordLoginForm } from "./EmailPasswordLoginForm";
import { MagicLinkLoginForm } from "./MagicLinkLoginForm";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = useTranslations("Auth");
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("welcome")}</CardTitle>
          <CardDescription>{t("loginSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {/* Google OAuth */}
            <GoogleLoginButton />

            {/* Divider */}
            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="relative z-10 bg-card px-2 text-muted-foreground">
                {t("or")}
              </span>
            </div>

            {/* Tabs: Passwort | Magic Link */}
            <Tabs defaultValue="password" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="password">{t("tabPassword")}</TabsTrigger>
                <TabsTrigger value="magic-link">
                  {t("tabMagicLink")}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="password" className="mt-4">
                <EmailPasswordLoginForm />
              </TabsContent>
              <TabsContent value="magic-link" className="mt-4">
                <MagicLinkLoginForm />
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Terms */}
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
        {t("termsStart")} <a href="#">{t("terms")}</a> {t("termsAnd")}{" "}
        <a href="#">{t("privacy")}</a>.
      </div>
    </div>
  );
}
