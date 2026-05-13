"use client";

import { cn } from "@/lib/utils";
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
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Willkommen</CardTitle>
          <CardDescription>
            Melde dich mit deinem Konto an
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {/* Social Login */}
            <div className="flex flex-col gap-4">
              <GoogleLoginButton />
              {/* TODO: AppleLoginButton — requires better-auth Apple
                  socialProvider config with JWT-signed client_secret. */}
              {/* TODO: MagicLinkLoginForm — requires better-auth magicLink
                  plugin with nodemailer-backed sendMagicLink. */}
            </div>

            {/* Divider */}
            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="relative z-10 bg-card px-2 text-muted-foreground">
                oder
              </span>
            </div>

            {/* Email/Password */}
            <EmailPasswordLoginForm />
          </div>
        </CardContent>
      </Card>

      {/* Terms */}
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
        Mit der Anmeldung akzeptierst du unsere{" "}
        <a href="#">Nutzungsbedingungen</a> und{" "}
        <a href="#">Datenschutzerklärung</a>.
      </div>
    </div>
  );
}
