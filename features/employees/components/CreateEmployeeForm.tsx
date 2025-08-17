"use client";

import { useForm } from "react-hook-form";
import {
  CreateEmployeeFormSchema,
  CreateEmployeeFormType,
} from "../schemas/create-employee-form.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { mapEnumToOptions } from "@/lib/forms/map-enum-to-options";
import { Persona } from "@/gql/graphql";
import { CreateButton } from "@/components/buttons/CreateButton";
import { createEmployeeAction } from "../actions/create-employee.action";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useSheet } from "@/components/providers/sheet-provider";

export const CreateEmployeeForm = () => {
  const t = useTranslations("Common");
  const { close } = useSheet();

  const form = useForm<CreateEmployeeFormType>({
    resolver: zodResolver(CreateEmployeeFormSchema),
    // du kannst auch parse({}) nehmen, aber explizit ist ok:
    defaultValues: CreateEmployeeFormSchema.parse({}),
  });

  const personaOptions = mapEnumToOptions(Persona);

  const onSubmit = async (values: CreateEmployeeFormType) => {
    try {
      const res = await createEmployeeAction(values);
      if (!res?.success) {
        throw new Error("Fehler bei der Erstellung des Mitarbeiters");
      }
      toast.success(t("success"));
      close();
    } catch (error) {
      console.log(error);
      toast.error(t("faild"));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="form-gap-y">
        <InputFormField name="firstName" label="firstName" />
        <InputFormField name="lastName" label="lastName" />
        <InputFormField name="email" label="email" />
        <SelectFormField
          name="persona"
          label="persona"
          options={personaOptions}
        />
        <CreateButton isSubmitting={form.formState.isSubmitting} />
      </form>
    </Form>
  );
};
