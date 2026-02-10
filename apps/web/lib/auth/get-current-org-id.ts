import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { AUTH_COOKIE } from "./get-auth-cookie";

interface TokenPayload {
  sub: string;
  orgId: string;
  membershipId: string;
  persona: string;
  roles?: string[];
  permissions?: string[];
  isSuperAdmin?: boolean;
}

/**
 * Extrahiert die aktive Organization-ID aus dem JWT-Token
 */
export const getCurrentOrgId = async (): Promise<string | undefined> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;

  if (!token) {
    return undefined;
  }

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    return decoded.orgId;
  } catch {
    return undefined;
  }
};
