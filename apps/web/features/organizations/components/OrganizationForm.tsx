import { useForm } from "react-hook-form";
import {
  OrganizationFormSchema,
  OrganizationFormType,
} from "../schemas/organization-form.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { sanitizeFormData } from "@/lib/forms/sanitize-form-data";
import { Form } from "@/components/ui/form";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { FormActionButtons } from "@/components/form/form-fields/FormActionButtons";

interface Props {
  data: any;
}

export const OrganizationForm = ({ data }: Props) => {
  const form = useForm<OrganizationFormType>({
    resolver: zodResolver(OrganizationFormSchema),
    defaultValues: OrganizationFormSchema.parse(sanitizeFormData(data)),
  });

  const onSubmit = async () => {};
  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <InputFormField name="organization" label="name" />
          <FormActionButtons />
        </form>
      </Form>
    </div>
  );
};
