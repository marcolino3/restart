"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { ComboboxFormField } from "@/components/form/form-fields/ComboboxFormField";
import { FormActionButtons } from "@/components/form/form-fields/FormActionButtons";
import { ROUTES } from "@/constants/routes";
import { handleAction } from "@/lib/actions/handle-action";
import { mapEnumToOptions } from "@/lib/forms/map-enum-to-options";
import { Persona } from "@restart/shared-types/graphql";

import {
  CreateUserFormSchema,
  CreateUserFormType,
} from "../schemas/create-user-form.schema";
import { createUserAction } from "../actions/create-user.action";
import {
  getRolesByOrgAction,
  OrgRole,
} from "../actions/get-roles-by-org.action";

interface Organization {
  id: string;
  name?: string | null;
}

interface CreateUserPageFormProps {
  organizations: Organization[];
}

const personaOptions = mapEnumToOptions(Persona);

export default function CreateUserPageForm({
  organizations,
}: CreateUserPageFormProps) {
  const t = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const [roles, setRoles] = useState<OrgRole[]>([]);
  const [isLoadingRoles, startLoadingRoles] = useTransition();

  const form = useForm<CreateUserFormType>({
    resolver: zodResolver(CreateUserFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      title: "",
      organizationId: "",
      persona: "",
      roleIds: [],
    },
  });

  const selectedOrgId = form.watch("organizationId");

  useEffect(() => {
    if (!selectedOrgId) {
      setRoles([]);
      return;
    }

    form.setValue("roleIds", []);

    startLoadingRoles(async () => {
      const result = await getRolesByOrgAction(selectedOrgId);
      if (result.success) {
        setRoles(result.data);
      } else {
        setRoles([]);
      }
    });
  }, [selectedOrgId, form]);

  const organizationOptions = organizations.map((org) => ({
    value: org.id,
    label: org.name ?? org.id,
  }));

  const roleOptions = roles.map((role) => ({
    value: role.id,
    label: role.name ?? role.id,
  }));

  const onSubmit = async (values: CreateUserFormType) => {
    await handleAction({
      action: () => createUserAction(values),
      successMessage: t("userCreated"),
      errorMessage: t("userCreateError"),
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
          <InputFormField name="email" label="email" type="email" />
          <InputFormField name="password" label="password" type="password" />
        </section>

        <Separator />

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">{t("organizationAndRole")}</h3>
          <ComboboxFormField
            name="organizationId"
            label="organization"
            placeholder="selectOrganization"
            options={organizationOptions}
            translateOptions={false}
            width="w-full"
          />
          <SelectFormField
            name="persona"
            label="persona"
            placeholder="selectPersona"
            options={personaOptions}
          />
          <ComboboxFormField
            name="roleIds"
            label="selectRoles"
            placeholder="selectRoles"
            options={roleOptions}
            translateOptions={false}
            multiple
            width="w-full"
          />
          {isLoadingRoles && (
            <p className="text-sm text-muted-foreground">...</p>
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
