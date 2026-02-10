"use client";

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
import { Loader2 } from "lucide-react";

export const MagicLinkLoginForm = () => {
  const form = useForm<MagicLinkLoginFormType>({
    resolver: zodResolver(MagicLinkLoginFormSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: MagicLinkLoginFormType) => {
    console.log(values);
  };

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
