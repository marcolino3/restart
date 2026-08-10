import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { useForm } from "react-hook-form";

import { Form } from "@/components/ui/form";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InputFormField } from "./InputFormField";
import { FieldResourceProvider } from "@/components/form/field-resource-context";
import {
  UserProvider,
  type CurrentUser,
  type EffectiveFieldPermission,
} from "@/features/users/context/current-user.context";

const baseUser: CurrentUser = {
  id: "u1",
  firstName: "Test",
  lastName: "User",
  email: "test@example.com",
  roles: [],
  permissions: [],
  fieldPermissions: [],
  isSuperAdmin: false,
  timeTrackingEnabled: false,
  isProjectMember: false,
};

function makeUser(fieldPermissions: EffectiveFieldPermission[]): CurrentUser {
  return { ...baseUser, fieldPermissions };
}

const messages = {
  EmployeeOnboarding: { grossSalaryMonthly: "Bruttolohn (mtl.)" },
  Common: { fieldPermissionDenied: "Keine Berechtigung zum Bearbeiten dieses Feldes" },
};

function Inner({ mode }: { mode: "create" | "update" }) {
  const form = useForm({ defaultValues: { grossSalary: "" } });
  return (
    <TooltipProvider>
      <Form {...form}>
        <FieldResourceProvider resource="employeeContract" mode={mode}>
          <InputFormField
            name="grossSalary"
            label="grossSalaryMonthly"
            namespace="EmployeeOnboarding"
          />
        </FieldResourceProvider>
      </Form>
    </TooltipProvider>
  );
}

function Harness({
  user,
  mode = "update",
}: {
  user: CurrentUser;
  mode?: "create" | "update";
}) {
  return (
    <NextIntlClientProvider locale="de" messages={messages}>
      <UserProvider user={user}>
        <Inner mode={mode} />
      </UserProvider>
    </NextIntlClientProvider>
  );
}

describe("InputFormField field-level RBAC", () => {
  it("is absent from the DOM without a read grant", () => {
    render(<Harness user={makeUser([])} />);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("is present but disabled with read but no update grant", () => {
    render(
      <Harness
        user={makeUser([
          { resource: "employeeContract", field: "grossSalary", actions: ["read"] },
        ])}
      />
    );
    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
    expect(input).toBeDisabled();
  });

  it("is present and enabled with read + update grant", () => {
    render(
      <Harness
        user={makeUser([
          {
            resource: "employeeContract",
            field: "grossSalary",
            actions: ["read", "update"],
          },
        ])}
      />
    );
    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
    expect(input).toBeEnabled();
  });
});
