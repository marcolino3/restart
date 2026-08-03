"use client";

import { ContractDocumentUpload } from "../ContractDocumentUpload";
import { ContractFormFields } from "../../ContractFormFields";

interface Props {
  teamOptions: { label: string; value: string }[];
  functionOptions: { label: string; value: string }[];
  draftId?: string;
}

/** Onboarding step 2 — thin wrapper around the shared contract form. */
export function StepContract({
  teamOptions,
  functionOptions,
  draftId,
}: Props) {
  return (
    <ContractFormFields
      functionOptions={functionOptions}
      teamOptions={teamOptions}
      showTeam
      showTimeTracking
      documentSlot={<ContractDocumentUpload draftId={draftId} />}
    />
  );
}
