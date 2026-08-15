import { gql } from "graphql-request";
import { gqlClient, setActiveOrg } from "./gql-client";
import { authCredentials, authHeaders } from "./auth-headers";
import { API_BASE_URL } from "./env";

type Org = { id: string; name?: string | null };

const MyOrganizationsDocument = gql`
  query MyOrganizations {
    organizations {
      id
      name
    }
  }
`;

/**
 * Ensures the mobile session has an active organization.
 *
 * The web app switches org automatically after login when the user has exactly
 * one membership (SelectOrgList); mobile had no equivalent, so session
 * .activeOrganizationId stayed null and every org-scoped query failed with
 * "No active membership". This mirrors the web behaviour:
 *
 * - exactly one org  → switch to it automatically (POST /api/org/switch), set
 *   the Active-Org header on the gql client, and return it.
 * - several orgs     → return them so the caller can show a picker (no
 *   automatic choice — the user must pick).
 * - none             → return null.
 */
export async function ensureActiveOrg(
  currentActiveOrgId: string | null,
): Promise<{ activeOrgId: string | null; choices: Org[] }> {
  if (currentActiveOrgId) {
    setActiveOrg(currentActiveOrgId);
    return { activeOrgId: currentActiveOrgId, choices: [] };
  }

  const { organizations } = await gqlClient.request<{ organizations: Org[] }>(
    MyOrganizationsDocument,
  );

  if (organizations.length === 1) {
    await switchOrg(organizations[0].id);
    return { activeOrgId: organizations[0].id, choices: [] };
  }
  if (organizations.length === 0) {
    return { activeOrgId: null, choices: [] };
  }
  // Multiple memberships → the caller decides.
  return { activeOrgId: null, choices: organizations };
}

/** Sets the Active-Org cookie server-side and the header on the gql client. */
export async function switchOrg(orgId: string): Promise<void> {
  await fetch(`${API_BASE_URL}/api/org/switch`, {
    method: "POST",
    // Platform-dependent: manual Cookie header with the jar off on native,
    // browser-sent cookie on web. See auth-headers.ts.
    credentials: authCredentials,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ orgId }),
  });
  setActiveOrg(orgId);
}
