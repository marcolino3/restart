"use client";

import { useState } from "react";
import { OrganizationSetting } from "../actions/get-settings.action";
import { SettingsTable } from "./SettingsTable";
import { EditSettingSheet } from "./EditSettingSheet";
import { DeleteSettingDialog } from "./DeleteSettingDialog";

interface Props {
  settings: OrganizationSetting[];
  organizationId: string;
}

export const SettingsPageClient = ({ settings, organizationId }: Props) => {
  const [editSetting, setEditSetting] = useState<OrganizationSetting | null>(null);
  const [deleteSetting, setDeleteSetting] = useState<OrganizationSetting | null>(null);

  return (
    <>
      <SettingsTable
        data={settings}
        organizationId={organizationId}
        onEdit={setEditSetting}
        onDelete={setDeleteSetting}
      />

      <EditSettingSheet
        organizationId={organizationId}
        setting={editSetting}
        open={!!editSetting}
        onOpenChange={(open) => !open && setEditSetting(null)}
      />

      <DeleteSettingDialog
        organizationId={organizationId}
        setting={deleteSetting}
        open={!!deleteSetting}
        onOpenChange={(open) => !open && setDeleteSetting(null)}
      />
    </>
  );
};
