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
import {
  MagicLinkLoginFormSchema,
  MagicLinkLoginFormType,
} from "../schemas/magic-link-login-form.schema";
import { Loader2, MailCheck } from "lucide-react";

export const MagicLinkLoginForm = () => {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const form = useForm<MagicLinkLoginFormType>({
    resolver: zodResolver(MagicLinkLoginFormSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: MagicLinkLoginFormType) => {
    const res = await fetch("/api/auth/magic-link/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: values.email }),
    });

    if (res.ok) {
      setSentEmail(values.email);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <MailCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Login-Link gesendet</p>
          <p className="text-sm text-muted-foreground">
            Wir haben dir einen Link an{" "}
            <strong className="text-foreground">{sentEmail}</strong> gesendet.
          </p>
        </div>
      </div>
    );
  }

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
              <Label htmlFor="magic-link-email">E-Mail</Label>
              <FormControl>
                <Input
                  {...field}
                  id="magic-link-email"
                  type="email"
                  placeholder="name@beispiel.de"
                  autoComplete="email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          variant="secondary"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Magic Link senden
        </Button>
      </form>
    </Form>
  );
};
