"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { handleAction } from "@/lib/actions/handle-action";
import { ROUTES } from "@/constants/routes";
import { createCurriculumAction } from "../actions/create-curriculum.action";
import { updateCurriculumAction } from "../actions/update-curriculum.action";
import {
  CurriculumFormSchema,
  type CurriculumFormValues,
} from "../schemas/curriculum-form.schema";
import type { CurriculumDTO, CurriculumLocale } from "../types";

interface Props {
  curriculum?: CurriculumDTO;
}

function findName(
  curriculum: CurriculumDTO | undefined,
  locale: CurriculumLocale,
): string {
  return curriculum?.translations.find((t) => t.locale === locale)?.name ?? "";
}

function findDescription(
  curriculum: CurriculumDTO | undefined,
  locale: CurriculumLocale,
): string {
  return (
    curriculum?.translations.find((t) => t.locale === locale)?.description ?? ""
  );
}

export const CurriculumForm = ({ curriculum }: Props) => {
  const t = useTranslations("Curricula");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();

  const form = useForm<CurriculumFormValues>({
    resolver: zodResolver(CurriculumFormSchema),
    defaultValues: {
      slug: curriculum?.slug ?? "",
      nameDe: findName(curriculum, "DE"),
      nameEn: findName(curriculum, "EN"),
      nameFr: findName(curriculum, "FR"),
      nameIt: findName(curriculum, "IT"),
      descriptionDe: findDescription(curriculum, "DE"),
    },
  });

  const onSubmit = async (values: CurriculumFormValues) => {
    const translations = (
      [
        {
          locale: "DE" as const,
          name: values.nameDe,
          description: values.descriptionDe || null,
        },
        { locale: "EN" as const, name: values.nameEn ?? "", description: null },
        { locale: "FR" as const, name: values.nameFr ?? "", description: null },
        { locale: "IT" as const, name: values.nameIt ?? "", description: null },
      ] as const
    )
      .filter((tr) => tr.name && tr.name.trim().length > 0)
      .map((tr) => ({
        locale: tr.locale,
        name: tr.name,
        description: tr.description,
      }));

    if (curriculum) {
      await handleAction({
        action: () =>
          updateCurriculumAction({
            id: curriculum.id,
            slug: values.slug,
            translations,
          }),
        successMessage: t("curriculumUpdated"),
        errorMessage: t("curriculumUpdateError"),
        onSuccess: () => router.refresh(),
      });
    } else {
      await handleAction({
        action: () =>
          createCurriculumAction({ slug: values.slug, translations }),
        successMessage: t("curriculumCreated"),
        errorMessage: t("curriculumCreateError"),
        onSuccess: (data) => {
          router.push(ROUTES.admin.curriculaEdit(locale, data.id));
        },
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <InputFormField name="slug" label="slug" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputFormField name="nameDe" label="nameDe" />
          <InputFormField name="nameEn" label="nameEn" />
          <InputFormField name="nameFr" label="nameFr" />
          <InputFormField name="nameIt" label="nameIt" />
        </div>
        <InputFormField name="descriptionDe" label="descriptionDe" />
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {tCommon("cancel")}
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {curriculum ? tCommon("save") : tCommon("create")}
          </Button>
        </div>
      </form>
    </Form>
  );
};
