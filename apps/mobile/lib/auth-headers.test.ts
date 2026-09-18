import { beforeEach, describe, expect, it, vi } from "vitest";

import { authClient } from "./auth-client";
import { authCredentials, authHeaders, wsConnectionParams } from "./auth-headers";

vi.mock("./auth-client", () => ({ authClient: { getCookie: vi.fn() } }));

describe("native session headers", () => {
  beforeEach(() => vi.mocked(authClient.getCookie).mockReset());

  it("waits for SecureStore before supplying the HTTP cookie", async () => {
    vi.mocked(authClient.getCookie).mockResolvedValue("session=first");
    await expect(authHeaders()).resolves.toEqual({ Cookie: "session=first" });
    expect(authCredentials).toBe("omit");
  });

  it("reads the current cookie on every WebSocket connection", async () => {
    vi.mocked(authClient.getCookie)
      .mockResolvedValueOnce("session=first")
      .mockResolvedValueOnce("session=refreshed");
    await expect(wsConnectionParams()).resolves.toEqual({ cookie: "session=first" });
    await expect(wsConnectionParams()).resolves.toEqual({ cookie: "session=refreshed" });
  });

  it("omits session headers after sign-out", async () => {
    vi.mocked(authClient.getCookie).mockResolvedValue("");
    await expect(authHeaders()).resolves.toEqual({});
    await expect(wsConnectionParams()).resolves.toEqual({});
  });
});
