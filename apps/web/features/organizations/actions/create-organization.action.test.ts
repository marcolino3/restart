import { describe, it, expect, vi, beforeEach } from "vitest";

const request = vi.fn();
const { redirect } = vi.hoisted(() => ({
  // next/navigation's redirect never returns; mimic that so the action stops.
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("@/lib/graphql/server-cookie-graphql-client", () => ({
  serverCookieGqlClient: vi.fn(async () => ({ request })),
}));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next-intl/server", () => ({ getLocale: vi.fn(async () => "de") }));

import { createOrganizationAction } from "./create-organization.action";
import { OrganizationFormSchema } from "../schemas/organization-form.schema";

const formValues = (overrides: Record<string, unknown> = {}) =>
  OrganizationFormSchema.parse({
    id: "00000000-0000-0000-0000-000000000000",
    name: "Montessori Rietberg",
    subdomain: "rietberg",
    ...overrides,
  });

describe("createOrganizationAction", () => {
  beforeEach(() => {
    request.mockReset();
    redirect.mockClear();
  });

  it("submits the full form payload, not just name and subdomain", async () => {
    request.mockResolvedValueOnce({ createOrganization: { id: "org-new" } });

    await expect(
      createOrganizationAction(
        formValues({
          shortCode: "MR",
          legalEntity: "Verein",
          city: "Zuerich",
          contactFirstName: "Anna",
          contactLastName: "Muster",
          contactEmail: "anna@example.org",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    const [, variables] = request.mock.calls[0] as [
      unknown,
      { input: Record<string, unknown> },
    ];
    expect(variables.input).toMatchObject({
      name: "Montessori Rietberg",
      subdomain: "rietberg",
      shortCode: "MR",
      legalEntity: "Verein",
      city: "Zuerich",
      contactFirstName: "Anna",
      contactLastName: "Muster",
      contactEmail: "anna@example.org",
    });
  });

  it("strips the placeholder id — the backend assigns the real one", async () => {
    request.mockResolvedValueOnce({ createOrganization: { id: "org-new" } });

    await expect(createOrganizationAction(formValues())).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    const [, variables] = request.mock.calls[0] as [
      unknown,
      { input: Record<string, unknown> },
    ];
    expect(variables.input).not.toHaveProperty("id");
  });

  it("redirects to the edit page of the created organization", async () => {
    request.mockResolvedValueOnce({ createOrganization: { id: "org-new" } });

    await expect(createOrganizationAction(formValues())).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(redirect).toHaveBeenCalledWith(expect.stringContaining("org-new"));
  });

  it("returns a failure result and does not redirect when the request fails", async () => {
    request.mockRejectedValueOnce(new Error("network down"));

    const result = await createOrganizationAction(formValues());

    expect(result).toEqual({ success: false, error: "network down" });
    expect(redirect).not.toHaveBeenCalled();
  });
});
