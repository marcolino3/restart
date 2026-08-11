"use client";

import { createContext, useContext, useMemo } from "react";

import { PROTECTED_FIELD_KEYS, protectedFieldKey } from "@restart/shared-schemas/rbac/field-catalog";

import { usePermissions } from "@/features/users/context/current-user.context";

type FieldResourceContextValue = {
  resource: string;
  mode: "create" | "update";
};

const FieldResourceContext = createContext<FieldResourceContextValue | null>(null);

type Props = {
  resource: string;
  mode?: "create" | "update";
  children: React.ReactNode;
};

export function FieldResourceProvider({ resource, mode = "update", children }: Props) {
  const value = useMemo(() => ({ resource, mode }), [resource, mode]);
  return <FieldResourceContext.Provider value={value}>{children}</FieldResourceContext.Provider>;
}

export function useFieldResource() {
  return useContext(FieldResourceContext);
}

export type FieldAccess = {
  visible: boolean;
  editable: boolean;
};

const ALWAYS_ACCESSIBLE: FieldAccess = { visible: true, editable: true };

// Mirrors fieldPermissionMiddleware on the backend: fields outside the
// catalog (or without an active resource context) are never gated.
export function useFieldAccess(name: string): FieldAccess {
  const resourceCtx = useFieldResource();
  const { canReadField, canWriteField } = usePermissions();

  return useMemo(() => {
    if (!resourceCtx) return ALWAYS_ACCESSIBLE;
    const { resource, mode } = resourceCtx;
    if (!PROTECTED_FIELD_KEYS.has(protectedFieldKey(resource, name))) return ALWAYS_ACCESSIBLE;

    const visible = canReadField(resource, name);
    const editable = visible && canWriteField(resource, name, mode);
    return { visible, editable };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceCtx?.resource, resourceCtx?.mode, name, canReadField, canWriteField]);
}
