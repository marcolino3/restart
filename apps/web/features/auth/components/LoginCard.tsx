import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MagicLinkLoginForm } from "./MagicLinkLoginForm";
import { Separator } from "@/components/ui/separator";
import { GoogleLoginButton } from "./GoogleLoginButton";

export const LoginCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-5">
        <MagicLinkLoginForm />
        <Separator />
        <GoogleLoginButton />
      </CardContent>
    </Card>
  );
};
