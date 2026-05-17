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
import { GoogleLoginButton } from "./GoogleLoginButton";
import { EmailPasswordLoginForm } from "./EmailPasswordLoginForm";

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
            {/* Social Login */}
            <div className="flex flex-col gap-4">
              <GoogleLoginButton />
            </div>

            {/* Divider */}
            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="relative z-10 bg-card px-2 text-muted-foreground">
                {t("or")}
              </span>
            </div>

            {/* Email/Password */}
            <EmailPasswordLoginForm />
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
