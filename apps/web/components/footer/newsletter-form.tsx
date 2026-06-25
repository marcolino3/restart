"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { API_URL } from "@/constants/api-url";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const newsletterSchema = z.object({
  email: z.string().email("Bitte eine gültige E-Mail-Adresse eingeben."),
  userType: z.enum(["Betroffene", "Fachpersonen", "Arbeitgebende", "Interessierte"]),
});

type NewsletterFormValues = z.infer<typeof newsletterSchema>;

const defaultSelections: Record<
  string,
  "Betroffene" | "Fachpersonen" | "Arbeitgebende" | "Interessierte"
> = {
  betroffene: "Betroffene",
  fachpersonen: "Fachpersonen",
  arbeitgebende: "Arbeitgebende",
  interessierte: "Interessierte",
};

interface NewsletterFormProps {
  slug: string;
}

export function NewsletterForm({ slug }: NewsletterFormProps) {
  const t = useTranslations("Common");

  const form = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      email: "",
      userType: "Betroffene", // Standard: Betroffene
    },
  });

  useEffect(() => {
    if (defaultSelections[slug]) {
      form.setValue("userType", defaultSelections[slug]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, form.setValue]);

  const onSubmit = async (data: NewsletterFormValues) => {
    try {
      const response = await fetch(
        `${API_URL}/contact-forms/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formType: "newsletter",
            email: data.email,
            data: { userType: data.userType },
          }),
        }
      );

      if (!response.ok) throw new Error("Submission failed");

      toast({
        title: t("newsletterFooterSuccess"),
        description: t("newsletterFooterSuccessDescription"),
      });
      form.reset();
    } catch (error) {
      console.error("Newsletter form submission error:", error);
      toast({
        title: t("newsletterFooterError"),
        description: t("newsletterFooterErrorDescription"),
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-w-md"
      >
        <div className="grid grid-cols-3 gap-x-4">
          {/* Email Field */}
          <div className="col-span-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      className="bg-periparto-green-300 text-sm text-periparto-black placeholder:text-periparto-black"
                      type="email"
                      placeholder={t("email-address")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Submit Button */}
          <div className="col-span-1">
            <Button type="submit" className="bg-white" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 animate-spin" />
              )}
              {t("register")}
            </Button>
          </div>
        </div>

        {/* Radio Group */}
        <FormField
          control={form.control}
          name="userType"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormItem className="flex items-center space-x-3">
                    <FormControl>
                      <RadioGroupItem value="Betroffene" className="bg-white" />
                    </FormControl>
                    <FormLabel className="relative -top-1">
                      {t("forAffectedIndividuals")}
                    </FormLabel>
                  </FormItem>

                  <FormItem className="flex items-center space-x-3">
                    <FormControl>
                      <RadioGroupItem
                        value="Fachpersonen"
                        className="bg-white"
                      />
                    </FormControl>
                    <FormLabel className="relative -top-1">
                      {t("forProfessionals")}
                    </FormLabel>
                  </FormItem>

                  <FormItem className="flex items-center space-x-3">
                    <FormControl>
                      <RadioGroupItem
                        value="Arbeitgebende"
                        className="bg-white"
                      />
                    </FormControl>
                    <FormLabel className="relative -top-1">
                      {t("forEmployers")}
                    </FormLabel>
                  </FormItem>

                  <FormItem className="flex items-center space-x-3">
                    <FormControl>
                      <RadioGroupItem
                        value="Interessierte"
                        className="bg-white"
                      />
                    </FormControl>
                    <FormLabel className="relative -top-1">
                      {t("forInterestedParties")}
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
