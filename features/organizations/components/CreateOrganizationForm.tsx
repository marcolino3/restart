"use client";

import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  CreateOrganizationSlugFormSchema,
  CreateOrganizationSlugFormType,
} from "../schemas/create-organization-slug-form.schema";

export const CreateOrganizationForm = () => {
  const form = useForm<CreateOrganizationSlugFormType>({
    resolver: zodResolver(CreateOrganizationSlugFormSchema),
    mode: "onBlur",
    defaultValues: {
      slug: "",
    },
  });

  const onSubmit = async (values: CreateOrganizationSlugFormType) => {
    console.log(values);
  };
  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="form-gap-y">
          <InputFormField name="slugs" label="slug" />

          <Button type="submit">Save</Button>
        </form>
      </Form>
    </div>
  );
};
