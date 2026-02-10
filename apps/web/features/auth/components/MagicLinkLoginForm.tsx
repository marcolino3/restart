"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
      <div className="flex flex-col items-center gap-y-3 py-4 text-center">
        <MailCheck className="h-10 w-10 text-green-600" />
        <p className="text-sm">
          Wir haben dir einen Login-Link an{" "}
          <strong>{sentEmail}</strong> gesendet. Pruefe dein Postfach.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-y-6"
        >
          <FormField
            name="email"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-Mail</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>
                  Wir schicken dir einen Login-Link per E-Mail.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 animate-spin" />
            )}
            Magic Link zusenden
          </Button>
        </form>
      </Form>
    </div>
  );
};
