"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LoginFormSchema, LoginFormType } from "../schemas/login-form.schema";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { authClient } from "@/lib/auth-client";

export const EmailPasswordLoginForm = () => {
  const [error, setError] = useState("");
  const router = useRouter();
  const locale = useLocale();

  const form = useForm<LoginFormType>({
    resolver: zodResolver(LoginFormSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormType) => {
    setError("");

    const { error: authError } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
      callbackURL: `/${locale}/admin`,
    });

    if (authError) {
      setError(authError.message ?? "E-Mail oder Passwort ist falsch.");
      return;
    }
    router.push(`/${locale}/admin`);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-6"
      >
        <FormField
          name="email"
          control={form.control}
          render={({ field }) => (
            <FormItem className="grid gap-2">
              <Label htmlFor="login-email">E-Mail</Label>
              <FormControl>
                <Input
                  {...field}
                  id="login-email"
                  type="email"
                  placeholder="name@beispiel.de"
                  autoComplete="email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="password"
          control={form.control}
          render={({ field }) => (
            <FormItem className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="login-password">Passwort</Label>
                <a
                  href="#"
                  className="ml-auto text-sm underline-offset-4 hover:underline"
                >
                  Passwort vergessen?
                </a>
              </div>
              <FormControl>
                <Input
                  {...field}
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Anmelden
        </Button>
      </form>
    </Form>
  );
};
