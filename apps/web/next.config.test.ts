import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Regression guard for the staging crash where the frontend pod died on start
 * with "Cannot find module .../@swc/helpers/esm/_interop_require_default.js".
 *
 * next resolves @swc/helpers through dist/server/require-hook.js via the
 * "module-sync" export condition, which points at esm/. The static file trace
 * only follows the "default" (cjs) branch, so next.config.ts adds the esm/
 * directory to outputFileTracingIncludes explicitly. These assertions fail if
 * the resolution the config relies on ever stops holding — which is what would
 * silently drop the directory from the bundle again.
 */
describe("@swc/helpers esm tracing", () => {
  const helpersPackageJson = createRequire(
    require.resolve("next/package.json"),
  ).resolve("@swc/helpers/package.json");
  const esmDir = path.join(path.dirname(helpersPackageJson), "esm");

  it("resolves @swc/helpers from next's own dependencies", () => {
    expect(existsSync(helpersPackageJson)).toBe(true);
  });

  it("ships the esm helper next loads at runtime", () => {
    expect(existsSync(path.join(esmDir, "_interop_require_default.js"))).toBe(
      true,
    );
  });

  it("exposes the helper through the module-sync condition, not cjs", () => {
    // If upstream ever drops the esm branch, the include is dead weight and the
    // runtime resolution changed — either way this test should be revisited.
    const exports = JSON.parse(readFileSync(helpersPackageJson, "utf8"))
      .exports as Record<string, Record<string, string> | undefined>;
    const entry = exports["./_/_interop_require_default"];

    expect(entry?.["module-sync"]).toBe("./esm/_interop_require_default.js");
  });
});
