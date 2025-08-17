"use client";

import { ComboboxFormField } from "@/components/form/auto-save-form-fields/ComboBoxFormField";
import { CalendarDateTimeFormField } from "@/components/form/auto-save-form-fields/CalendarDateTimeFormField";
import { InputFormField } from "@/components/form/auto-save-form-fields/InputAutoSaveFormField";
import { TextareaFormField } from "@/components/form/auto-save-form-fields/TextareaAutoSaveFormFied";
import { Form } from "@/components/ui/form";
import { updateUserAction } from "@/features/users/actions/update-user.action";
import {
  UserFormSchema,
  UserFormType,
} from "@/features/users/schemas/user-form.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { CalendarDateFormField } from "@/components/form/auto-save-form-fields/CalendarDateFormField";
import { TimeFormField } from "@/components/form/auto-save-form-fields/TimeFormField";
import { CheckboxGroupFormField } from "@/components/form/auto-save-form-fields/CheckboxGroupFormField";
import { RadioGroupFormField } from "@/components/form/auto-save-form-fields/RadioGroupFormField";
import { SelectFormField } from "@/components/form/auto-save-form-fields/SelectAutoSaveFormField";
import { EditorFormField } from "@/components/form/auto-save-form-fields/EditorFormField";
import { SliderFormField } from "@/components/form/auto-save-form-fields/SliderFormField";
import { SwitchFormField } from "@/components/form/auto-save-form-fields/SwitchAutoSaveFormField";
import { SwitchBoxFormField } from "@/components/form/auto-save-form-fields/SwitchBoxFormField";

interface Props {
  user: {
    id: string;
    email: string;
    description: string;
    items: string[];
    preferredLanguage: string;
    favoriteFruit: string;
    engagementLevel: number;
  };
}

const UserForm = ({ user }: Props) => {
  const form = useForm<UserFormType>({
    resolver: zodResolver(UserFormSchema),
    defaultValues: {
      id: user.id,
      email: user.email ?? "",
      description: user.description ?? "",
      birthdate: new Date(),
      items: user.items ?? [],
      preferredLanguage: user.preferredLanguage ?? "",
      favoriteFruit: user.favoriteFruit ?? "",
      engagementLevel: 50,
    },
  });

  const options = [
    {
      value: "Marco",
      label: "Marco",
    },
    {
      value: "Yvonne",
      label: "Yvonne",
    },
    {
      value: "Quinn",
      label: "Quinn",
    },
  ];

  const handleInlineSave = async (name: keyof UserFormType, value: unknown) => {
    const result = await updateUserAction({
      id: user.id,
      [name]: value,
    } as Partial<UserFormType> & { id: string });
    console.log(result);
    return result.success;
  };
  return (
    <div>
      <Form {...form}>
        <InputFormField
          name="email"
          label="Email"
          onSave={(value) => handleInlineSave("email", value)}
        />

        <TextareaFormField
          name="description"
          label="Description"
          onSave={(value) => handleInlineSave("description", value)}
        />

        <ComboboxFormField
          name="email"
          label="Email"
          options={options}
          onSave={(value) => handleInlineSave("email", value)}
        />
        <CalendarDateTimeFormField
          name="birthDate"
          label="Geburtsdatum"
          onSave={(value) => handleInlineSave("email", value)}
        />

        <CalendarDateFormField
          name="birthDate"
          label="Geburtsdatum"
          onSave={(value) => handleInlineSave("email", value)}
        />

        <TimeFormField
          name="startTime"
          label="Beginn"
          onSave={(value) => handleInlineSave("email", value)}
        />

        <CheckboxGroupFormField
          name="items"
          label="Sidebar"
          description="Wähle die sichtbaren Elemente in der Sidebar."
          items={[
            { id: "recents", label: "Recents" },
            { id: "home", label: "Home" },
            { id: "desktop", label: "Desktop" },
          ]}
          onSave={(value) => handleInlineSave("items", value)}
        />

        <RadioGroupFormField
          name="preferredLanguage"
          label="Bevorzugte Sprache"
          options={[
            { value: "de", label: "Deutsch" },
            { value: "it", label: "Italienisch" },
            { value: "en", label: "Englisch" },
          ]}
          onSave={(value) => handleInlineSave("preferredLanguage", value)}
        />

        <SelectFormField
          name="favoriteFruit"
          label="Lieblingsfrucht"
          description="Wähle deine Lieblingsfrucht aus."
          options={[
            { value: "apple", label: "Apfel" },
            { value: "banana", label: "Banane" },
            { value: "grapes", label: "Trauben" },
          ]}
          onSave={(value) => handleInlineSave("favoriteFruit", value)}
        />

        <EditorFormField
          name="description"
          label="Beschreibung"
          onSave={(value) => handleInlineSave("description", value)}
        />

        <SliderFormField
          name="engagementLevel"
          label="Engagement"
          onSave={(value) => handleInlineSave("engagementLevel", value)}
          max={100}
          step={1}
        />

        <SwitchFormField
          name="airplaneMode"
          label="Airplane Mode"
          onSave={(value) => handleInlineSave("airplaneMode", value)}
        />

        <SwitchBoxFormField
          name="marketing_emails"
          label="Marketing Emails"
          description="Erhalte Neuigkeiten zu Produkten, Funktionen und mehr."
          onSave={(value) => handleInlineSave("marketing_emails", value)}
        />
      </Form>
    </div>
  );
};

export default UserForm;
