"use client";

import * as React from "react";
import { IconCheck, IconSelector } from "@tabler/icons-react";

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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type Organization = {
  id: string;
  name?: string | null;
};

interface OrgSwitcherProps {
  organizations: Organization[];
  currentOrgId?: string;
}

export function OrgSwitcher({ organizations, currentOrgId }: OrgSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const [switching, setSwitching] = React.useState(false);

  const currentOrg = organizations.find((o) => o.id === currentOrgId);

  async function handleSelect(orgId: string) {
    if (orgId === currentOrgId) {
      setOpen(false);
      return;
    }

    setSwitching(true);
    try {
      const res = await fetch("/api/org/switch", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId }),
      });

      if (res.ok) {
        window.location.reload();
      }
    } finally {
      setSwitching(false);
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:!p-1.5"
              disabled={switching}
            >
              <span className="truncate font-semibold">
                {switching
                  ? "Wechsle..."
                  : currentOrg?.name ?? "Org waehlen..."}
              </span>
              <IconSelector className="ml-auto !size-4 opacity-50" />
            </SidebarMenuButton>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder="Organisation suchen..." />
              <CommandList>
                <CommandEmpty>Keine Organisation gefunden.</CommandEmpty>
                <CommandGroup>
                  {organizations.map((org) => (
                    <CommandItem
                      key={org.id}
                      value={org.name ?? org.id}
                      onSelect={() => handleSelect(org.id)}
                    >
                      <span>{org.name}</span>
                      {org.id === currentOrgId && (
                        <IconCheck className="ml-auto !size-4" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
