"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { FormActionButtons } from "@/components/form/form-fields/FormActionButtons";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { handleAction } from "@/lib/actions/handle-action";
import { sanitizeFormData } from "@/lib/forms/sanitize-form-data";

import {
  UpdateUserFormSchema,
  UpdateUserFormOutput,
} from "../schemas/update-user-form.schema";
import { updateUserAction } from "../actions/update-user.action";
import { UserDetail } from "../actions/get-user-by-id.action";
import { UserEmailsManager } from "./UserEmailsManager";

interface UserFormProps {
  user: UserDetail;
}

export default function UserForm({ user }: UserFormProps) {
  const t = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(UpdateUserFormSchema),
    defaultValues: UpdateUserFormSchema.parse(
      sanitizeFormData({
        id: user.id,
        title: user.title ?? "",
        firstName: user.firstName,
        lastName: user.lastName,
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : null,
        socialSecurityNumber: "",
      })
    ),
  });

  const onSubmit = async (values: Record<string, unknown>) => {
    await handleAction({
      action: () => updateUserAction(values as UpdateUserFormOutput),
      successMessage: t("userUpdated"),
      errorMessage: t("userUpdateError"),
      onSuccess: () => {
        router.push(ROUTES.admin.users(locale));
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">{t("personalData")}</h3>
          <InputFormField name="title" label="title" />
          <div className="flex gap-4">
            <InputFormField name="firstName" label="firstName" width="w-1/2" />
            <InputFormField name="lastName" label="lastName" width="w-1/2" />
          </div>
          <DatePickerFormField name="dateOfBirth" label="dateOfBirth" />
          <InputFormField
            name="socialSecurityNumber"
            label="socialSecurityNumber"
          />
        </section>

        <Separator />

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">{t("emails")}</h3>
          <UserEmailsManager
            userId={user.id}
            emails={user.userEmails ?? []}
          />
        </section>

        <Separator />

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">{t("memberships")}</h3>
          {user.memberships?.length ? (
            <div className="space-y-2">
              {user.memberships.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 p-2 rounded border"
                >
                  <span className="flex-1 font-medium">
                    {m.organization.name}
                  </span>
                  <Badge variant="secondary">{t(m.persona)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">{t("noResults")}</p>
          )}
        </section>

        <FormActionButtons
          disabled={form.formState.isSubmitting}
          onCancel={() => {
            router.push(ROUTES.admin.users(locale));
          }}
        />
      </form>
    </Form>
  );
}
