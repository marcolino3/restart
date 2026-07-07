"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form } from "@/components/ui/form";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { CheckboxFormField } from "@/components/form/form-fields/CheckboxFormField";
import { ComboboxFormField } from "@/components/form/form-fields/ComboboxFormField";
import { handleAction } from "@/lib/actions/handle-action";
import { ROUTES } from "@/constants/routes";
import { RELATIONSHIP_TYPES } from "@/features/contact-persons/schemas/contact-person-form.schema";
import { StudentContactPersonItem } from "@/features/contact-persons/actions/get-student-contact-persons.action";
import { ContactPersonListItem } from "@/features/contact-persons/actions/get-contact-persons.action";
import { linkContactPersonToStudentAction } from "@/features/contact-persons/actions/link-contact-person-to-student.action";
import { unlinkContactPersonFromStudentAction } from "@/features/contact-persons/actions/unlink-contact-person-from-student.action";
import { updateStudentContactPersonLinkAction } from "@/features/contact-persons/actions/update-student-contact-person-link.action";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";

interface Props {
  studentId: string;
  links: StudentContactPersonItem[];
  allContactPersons: ContactPersonListItem[];
}

const RelationshipFieldsSchema = z.object({
  relationshipType: z.string().min(1),
  isPrimaryContact: z.boolean(),
  hasCustody: z.boolean(),
  isPickupAuthorized: z.boolean(),
  livesWithStudent: z.boolean(),
  emergencyPriority: z.string(),
});

const AssignSchema = RelationshipFieldsSchema.extend({
  contactPersonId: z.string().min(1),
});
type AssignValues = z.infer<typeof AssignSchema>;

const EditSchema = RelationshipFieldsSchema.extend({
  notes: z.string(),
});
type EditValues = z.infer<typeof EditSchema>;

const ASSIGN_DEFAULTS: AssignValues = {
  contactPersonId: "",
  relationshipType: "",
  isPrimaryContact: false,
  hasCustody: false,
  isPickupAuthorized: true,
  livesWithStudent: false,
  emergencyPriority: "",
};

export function StudentContactPersonsList({
  studentId,
  links: initialLinks,
  allContactPersons,
}: Props) {
  const tS = useTranslations("Students");
  const tC = useTranslations("ContactPersons");
  const tCommon = useTranslations("Common");
  const locale = useLocale();

  const [links, setLinks] =
    React.useState<StudentContactPersonItem[]>(initialLinks);

  const [assignDialogOpen, setAssignDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editingLink, setEditingLink] =
    React.useState<StudentContactPersonItem | null>(null);

  const assignForm = useForm<AssignValues>({
    resolver: zodResolver(AssignSchema),
    defaultValues: ASSIGN_DEFAULTS,
  });

  const editForm = useForm<EditValues>({
    resolver: zodResolver(EditSchema),
    defaultValues: {
      relationshipType: "",
      isPrimaryContact: false,
      hasCustody: false,
      isPickupAuthorized: true,
      livesWithStudent: false,
      emergencyPriority: "",
      notes: "",
    },
  });

  const linkedContactPersonIds = new Set(
    links.map((l) => l.contactPerson.id),
  );
  const availableContactPersons = allContactPersons.filter(
    (cp) => !cp.isArchived && !linkedContactPersonIds.has(cp.id),
  );

  const contactPersonOptions = availableContactPersons.map((cp) => ({
    label: cp.email
      ? `${cp.firstName} ${cp.lastName} (${cp.email})`
      : `${cp.firstName} ${cp.lastName}`,
    value: cp.id,
  }));

  const relationshipOptions = RELATIONSHIP_TYPES.map((r) => ({
    label: tC(r),
    value: r,
  })).sort((a, b) => a.label.localeCompare(b.label));

  const openEditDialog = (link: StudentContactPersonItem) => {
    setEditingLink(link);
    editForm.reset({
      relationshipType: link.relationshipType,
      isPrimaryContact: link.isPrimaryContact,
      hasCustody: link.hasCustody,
      isPickupAuthorized: link.isPickupAuthorized,
      livesWithStudent: link.livesWithStudent,
      emergencyPriority: link.emergencyPriority
        ? String(link.emergencyPriority)
        : "",
      notes: link.notes ?? "",
    });
    setEditDialogOpen(true);
  };

  const handleLink = async (values: AssignValues) => {
    await handleAction({
      action: () =>
        linkContactPersonToStudentAction({
          studentId,
          contactPersonId: values.contactPersonId,
          relationshipType: values.relationshipType,
          isPrimaryContact: values.isPrimaryContact,
          hasCustody: values.hasCustody,
          isPickupAuthorized: values.isPickupAuthorized,
          livesWithStudent: values.livesWithStudent,
          emergencyPriority: values.emergencyPriority
            ? parseInt(values.emergencyPriority)
            : undefined,
        }),
      successMessage: tS("contactPersonLinked"),
      errorMessage: tS("contactPersonLinkError"),
      onSuccess: () => {
        setAssignDialogOpen(false);
        assignForm.reset(ASSIGN_DEFAULTS);
        window.location.reload();
      },
    });
  };

  const handleUpdate = async (values: EditValues) => {
    if (!editingLink) return;
    await handleAction({
      action: () =>
        updateStudentContactPersonLinkAction(
          {
            id: editingLink.id,
            relationshipType: values.relationshipType,
            isPrimaryContact: values.isPrimaryContact,
            hasCustody: values.hasCustody,
            isPickupAuthorized: values.isPickupAuthorized,
            livesWithStudent: values.livesWithStudent,
            emergencyPriority: values.emergencyPriority
              ? parseInt(values.emergencyPriority)
              : null,
            notes: values.notes || null,
          },
          studentId,
        ),
      successMessage: tS("contactPersonLinkUpdated"),
      errorMessage: tS("contactPersonLinkUpdateError"),
      onSuccess: () => {
        setEditDialogOpen(false);
        setEditingLink(null);
        window.location.reload();
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{tS("contactPersons")}</CardTitle>
          <Dialog
            open={assignDialogOpen}
            onOpenChange={(open) => {
              setAssignDialogOpen(open);
              if (!open) assignForm.reset(ASSIGN_DEFAULTS);
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {tS("assignContactPerson")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{tS("assignContactPerson")}</DialogTitle>
              </DialogHeader>
              <Form {...assignForm}>
                <form
                  onSubmit={assignForm.handleSubmit(handleLink)}
                  className="space-y-4"
                >
                  <ComboboxFormField
                    name="contactPersonId"
                    label="selectContactPerson"
                    namespace="Students"
                    options={contactPersonOptions}
                    translateOptions={false}
                    modal
                    width="w-full"
                  />
                  <ComboboxFormField
                    name="relationshipType"
                    label="relationshipType"
                    namespace="ContactPersons"
                    options={relationshipOptions}
                    translateOptions={false}
                    modal
                    width="w-full"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <CheckboxFormField
                      name="isPrimaryContact"
                      label="primaryContact"
                      namespace="Students"
                    />
                    <CheckboxFormField
                      name="hasCustody"
                      label="custody"
                      namespace="Students"
                    />
                    <CheckboxFormField
                      name="isPickupAuthorized"
                      label="pickupAuthorized"
                      namespace="Students"
                    />
                    <CheckboxFormField
                      name="livesWithStudent"
                      label="livesWithStudent"
                      namespace="Students"
                    />
                  </div>
                  <InputFormField
                    name="emergencyPriority"
                    label="emergencyPriority"
                    namespace="Students"
                    type="number"
                    placeholder="1"
                  />
                  <Button
                    type="submit"
                    disabled={assignForm.formState.isSubmitting}
                    className="w-full"
                  >
                    {tS("assignContactPerson")}
                  </Button>

                  <div className="text-center">
                    <Link
                      href={ROUTES.admin.contactPersonsCreate(locale)}
                      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {tS("createNewContactPerson")}
                    </Link>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {links.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {tS("noContactPersons")}
          </p>
        ) : (
          <div className="space-y-2">
            {links.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between rounded-md border px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={ROUTES.admin.contactPersonsEdit(
                      locale,
                      link.contactPerson.id,
                    )}
                    className="font-medium hover:underline"
                  >
                    {link.contactPerson.firstName}{" "}
                    {link.contactPerson.lastName}
                  </Link>
                  <Badge variant="secondary">
                    {tC(link.relationshipType)}
                  </Badge>
                  {link.isPrimaryContact && (
                    <Badge variant="default">{tS("primaryContact")}</Badge>
                  )}
                  {link.hasCustody && (
                    <Badge variant="outline">{tS("custody")}</Badge>
                  )}
                  {link.isPickupAuthorized && (
                    <Badge variant="outline">{tS("pickupAuthorized")}</Badge>
                  )}
                  {link.emergencyPriority && (
                    <Badge variant="outline">
                      {tS("emergencyPriority")}: {link.emergencyPriority}
                    </Badge>
                  )}
                  {(link.contactPerson.email ||
                    link.contactPerson.phone ||
                    link.contactPerson.mobile) && (
                    <span className="text-muted-foreground text-sm">
                      {[
                        link.contactPerson.email,
                        link.contactPerson.phone,
                        link.contactPerson.mobile,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">{tCommon("openMenu")}</span>
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => openEditDialog(link)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      {tCommon("edit")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DeleteConfirmationDialog
                      title={tS("removeLink")}
                      description={tS("confirmRemoveLink")}
                      onConfirm={() =>
                        unlinkContactPersonFromStudentAction(
                          link.id,
                          studentId,
                        )
                      }
                      onSuccess={() =>
                        setLinks((prev) =>
                          prev.filter((l) => l.id !== link.id),
                        )
                      }
                      trigger={
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive cursor-pointer"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {tCommon("delete")}
                        </DropdownMenuItem>
                      }
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {tS("editContactPersonLink")}
              {editingLink && (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  &ndash; {editingLink.contactPerson.firstName}{" "}
                  {editingLink.contactPerson.lastName}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleUpdate)}
              className="space-y-4"
            >
              <ComboboxFormField
                name="relationshipType"
                label="relationshipType"
                namespace="ContactPersons"
                options={relationshipOptions}
                translateOptions={false}
                modal
                width="w-full"
              />
              <div className="grid grid-cols-2 gap-3">
                <CheckboxFormField
                  name="isPrimaryContact"
                  label="primaryContact"
                  namespace="Students"
                />
                <CheckboxFormField
                  name="hasCustody"
                  label="custody"
                  namespace="Students"
                />
                <CheckboxFormField
                  name="isPickupAuthorized"
                  label="pickupAuthorized"
                  namespace="Students"
                />
                <CheckboxFormField
                  name="livesWithStudent"
                  label="livesWithStudent"
                  namespace="Students"
                />
              </div>
              <InputFormField
                name="emergencyPriority"
                label="emergencyPriority"
                namespace="Students"
                type="number"
                placeholder="1"
              />
              <InputFormField
                name="notes"
                label="notes"
                namespace="Common"
              />
              <Button
                type="submit"
                disabled={editForm.formState.isSubmitting}
                className="w-full"
              >
                {tCommon("save")}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
