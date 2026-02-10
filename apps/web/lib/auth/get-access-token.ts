import { cookies } from "next/headers";
import { AUTH_COOKIE } from "./get-auth-cookie";

/**
 * Liest den accessToken aus dem CookieStore (Server Components, Server Actions)
 */
export const getAccessToken = async (): Promise<string | undefined> => {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE)?.value;
};
