"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Plus,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
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

  // --- Assign dialog state ---
  const [assignDialogOpen, setAssignDialogOpen] = React.useState(false);
  const [isLinking, setIsLinking] = React.useState(false);
  const [selectedContactPersonId, setSelectedContactPersonId] =
    React.useState("");
  const [selectedRelationshipType, setSelectedRelationshipType] =
    React.useState("");
  const [isPrimaryContact, setIsPrimaryContact] = React.useState(false);
  const [hasCustody, setHasCustody] = React.useState(false);
  const [isPickupAuthorized, setIsPickupAuthorized] = React.useState(true);
  const [livesWithStudent, setLivesWithStudent] = React.useState(false);
  const [emergencyPriority, setEmergencyPriority] = React.useState("");
  const [comboboxOpen, setComboboxOpen] = React.useState(false);

  // --- Edit dialog state ---
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editingLink, setEditingLink] =
    React.useState<StudentContactPersonItem | null>(null);
  const [editRelationshipType, setEditRelationshipType] = React.useState("");
  const [editIsPrimaryContact, setEditIsPrimaryContact] = React.useState(false);
  const [editHasCustody, setEditHasCustody] = React.useState(false);
  const [editIsPickupAuthorized, setEditIsPickupAuthorized] =
    React.useState(true);
  const [editLivesWithStudent, setEditLivesWithStudent] = React.useState(false);
  const [editEmergencyPriority, setEditEmergencyPriority] = React.useState("");
  const [editNotes, setEditNotes] = React.useState("");
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [assignRelTypeOpen, setAssignRelTypeOpen] = React.useState(false);
  const [editRelTypeOpen, setEditRelTypeOpen] = React.useState(false);

  // Filter out already-linked contact persons
  const linkedContactPersonIds = new Set(
    links.map((l) => l.contactPerson.id),
  );
  const availableContactPersons = allContactPersons.filter(
    (cp) => !cp.isArchived && !linkedContactPersonIds.has(cp.id),
  );

  const selectedContactPerson = allContactPersons.find(
    (cp) => cp.id === selectedContactPersonId,
  );

  const resetAssignForm = () => {
    setSelectedContactPersonId("");
    setSelectedRelationshipType("");
    setIsPrimaryContact(false);
    setHasCustody(false);
    setIsPickupAuthorized(true);
    setLivesWithStudent(false);
    setEmergencyPriority("");
    setComboboxOpen(false);
  };

  const openEditDialog = (link: StudentContactPersonItem) => {
    setEditingLink(link);
    setEditRelationshipType(link.relationshipType);
    setEditIsPrimaryContact(link.isPrimaryContact);
    setEditHasCustody(link.hasCustody);
    setEditIsPickupAuthorized(link.isPickupAuthorized);
    setEditLivesWithStudent(link.livesWithStudent);
    setEditEmergencyPriority(
      link.emergencyPriority ? String(link.emergencyPriority) : "",
    );
    setEditNotes(link.notes ?? "");
    setEditDialogOpen(true);
  };

  const handleLink = async () => {
    if (!selectedContactPersonId || !selectedRelationshipType) return;
    setIsLinking(true);

    await handleAction({
      action: () =>
        linkContactPersonToStudentAction({
          studentId,
          contactPersonId: selectedContactPersonId,
          relationshipType: selectedRelationshipType,
          isPrimaryContact,
          hasCustody,
          isPickupAuthorized,
          livesWithStudent,
          emergencyPriority: emergencyPriority
            ? parseInt(emergencyPriority)
            : undefined,
        }),
      successMessage: tS("contactPersonLinked"),
      errorMessage: tS("contactPersonLinkError"),
      onSuccess: () => {
        setAssignDialogOpen(false);
        resetAssignForm();
        window.location.reload();
      },
    });

    setIsLinking(false);
  };

  const handleUpdate = async () => {
    if (!editingLink || !editRelationshipType) return;
    setIsUpdating(true);

    await handleAction({
      action: () =>
        updateStudentContactPersonLinkAction(
          {
            id: editingLink.id,
            relationshipType: editRelationshipType,
            isPrimaryContact: editIsPrimaryContact,
            hasCustody: editHasCustody,
            isPickupAuthorized: editIsPickupAuthorized,
            livesWithStudent: editLivesWithStudent,
            emergencyPriority: editEmergencyPriority
              ? parseInt(editEmergencyPriority)
              : null,
            notes: editNotes || null,
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

    setIsUpdating(false);
  };

  const relationshipOptions = RELATIONSHIP_TYPES.map((r) => ({
    label: tC(r),
    value: r,
  })).sort((a, b) => a.label.localeCompare(b.label));

  // Shared form fields for assign and edit dialogs
  const renderRelationshipFields = (
    mode: "assign" | "edit",
  ) => {
    const rt = mode === "assign" ? selectedRelationshipType : editRelationshipType;
    const setRt = mode === "assign" ? setSelectedRelationshipType : setEditRelationshipType;
    const pc = mode === "assign" ? isPrimaryContact : editIsPrimaryContact;
    const setPc = mode === "assign" ? setIsPrimaryContact : setEditIsPrimaryContact;
    const cust = mode === "assign" ? hasCustody : editHasCustody;
    const setCust = mode === "assign" ? setHasCustody : setEditHasCustody;
    const pickup = mode === "assign" ? isPickupAuthorized : editIsPickupAuthorized;
    const setPickup = mode === "assign" ? setIsPickupAuthorized : setEditIsPickupAuthorized;
    const lives = mode === "assign" ? livesWithStudent : editLivesWithStudent;
    const setLives = mode === "assign" ? setLivesWithStudent : setEditLivesWithStudent;
    const ep = mode === "assign" ? emergencyPriority : editEmergencyPriority;
    const setEp = mode === "assign" ? setEmergencyPriority : setEditEmergencyPriority;
    const relTypeOpen = mode === "assign" ? assignRelTypeOpen : editRelTypeOpen;
    const setRelTypeOpen = mode === "assign" ? setAssignRelTypeOpen : setEditRelTypeOpen;
    const selectedRelLabel = relationshipOptions.find((o) => o.value === rt)?.label;

    return (
      <>
        {/* Relationship Type */}
        <div className="space-y-2">
          <Label>{tC("relationshipType")}</Label>
          <Popover open={relTypeOpen} onOpenChange={setRelTypeOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={relTypeOpen}
                className={cn(
                  "w-full justify-between",
                  !rt && "text-muted-foreground",
                )}
              >
                {selectedRelLabel ?? tC("relationshipType")}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder={tS("searchContactPerson")} />
                <CommandList>
                  <CommandEmpty>{tC("noContactPersonsFound")}</CommandEmpty>
                  <CommandGroup>
                    {relationshipOptions.map((opt) => (
                      <CommandItem
                        key={opt.value}
                        value={opt.label}
                        onSelect={() => {
                          setRt(opt.value);
                          setRelTypeOpen(false);
                        }}
                      >
                        {opt.label}
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            rt === opt.value ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Checkboxes */}
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={pc}
              onCheckedChange={(v) => setPc(v === true)}
            />
            {tS("primaryContact")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={cust}
              onCheckedChange={(v) => setCust(v === true)}
            />
            {tS("custody")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={pickup}
              onCheckedChange={(v) => setPickup(v === true)}
            />
            {tS("pickupAuthorized")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={lives}
              onCheckedChange={(v) => setLives(v === true)}
            />
            {tS("livesWithStudent")}
          </label>
        </div>

        {/* Emergency Priority */}
        <div className="space-y-2">
          <Label>{tS("emergencyPriority")}</Label>
          <Input
            type="number"
            min={1}
            placeholder="1"
            value={ep}
            onChange={(e) => setEp(e.target.value)}
          />
        </div>

        {/* Notes (only in edit mode) */}
        {mode === "edit" && (
          <div className="space-y-2">
            <Label>{tCommon("notes")}</Label>
            <Input
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />
          </div>
        )}
      </>
    );
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
              if (!open) resetAssignForm();
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
              <div className="space-y-4">
                {/* Contact Person Combobox */}
                <div className="space-y-2">
                  <Label>{tS("selectContactPerson")}</Label>
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={comboboxOpen}
                        className={cn(
                          "w-full justify-between",
                          !selectedContactPersonId && "text-muted-foreground",
                        )}
                      >
                        {selectedContactPerson
                          ? `${selectedContactPerson.firstName} ${selectedContactPerson.lastName}`
                          : tS("selectContactPerson")}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder={tS("searchContactPerson")}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {tC("noContactPersonsFound")}
                          </CommandEmpty>
                          <CommandGroup>
                            {availableContactPersons.map((cp) => (
                              <CommandItem
                                key={cp.id}
                                value={`${cp.firstName} ${cp.lastName} ${cp.email ?? ""}`}
                                onSelect={() => {
                                  setSelectedContactPersonId(cp.id);
                                  setComboboxOpen(false);
                                }}
                              >
                                {cp.firstName} {cp.lastName}
                                {cp.email && (
                                  <span className="ml-1 text-muted-foreground">
                                    ({cp.email})
                                  </span>
                                )}
                                <Check
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    selectedContactPersonId === cp.id
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {renderRelationshipFields("assign")}

                {/* Submit */}
                <Button
                  onClick={handleLink}
                  disabled={
                    isLinking ||
                    !selectedContactPersonId ||
                    !selectedRelationshipType
                  }
                  className="w-full"
                >
                  {tS("assignContactPerson")}
                </Button>

                {/* Link to create new contact person */}
                <div className="text-center">
                  <Link
                    href={ROUTES.admin.contactPersonsCreate(locale)}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {tS("createNewContactPerson")}
                  </Link>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {links.length === 0 ? (
          <p className="text-sm text-muted-foreground">
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
                    <span className="text-sm text-muted-foreground">
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

                {/* Three-dots dropdown */}
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
                      <Pencil className="h-4 w-4 mr-2" />
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
                          <Trash2 className="h-4 w-4 mr-2" />
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {tS("editContactPersonLink")}
              {editingLink && (
                <span className="font-normal text-muted-foreground">
                  {" "}
                  &ndash; {editingLink.contactPerson.firstName}{" "}
                  {editingLink.contactPerson.lastName}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {renderRelationshipFields("edit")}

            <Button
              onClick={handleUpdate}
              disabled={isUpdating || !editRelationshipType}
              className="w-full"
            >
              {tCommon("save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
