/**
 * Build-version staleness detection.
 *
 * Two complementary checks:
 * 1. Build-time SHA (injected by Vite `define`) — detected on script load.
 * 2. Server version from `hello-ok` — detected on each WebSocket connect.
 *
 * When a version change is detected and it's not the first-ever page load,
 * a hard reload fetches the fresh index.html (which references new
 * content-hashed JS/CSS assets).
 *
 * Uses sessionStorage so the stored value is tab-scoped and naturally clears
 * on tab close, preventing reload loops.
 */

declare const __APP_BUILD_SHA__: string | undefined;

const BUILD_SHA_KEY = "openclaw.build-sha";
const SERVER_VERSION_KEY = "openclaw.server-version";

/**
 * Called once at module load time (from main.ts or app-lifecycle).
 * Compares the build-time SHA baked into the JS bundle against the SHA
 * stored from the previous page load.
 *
 * Returns true if a reload was triggered (caller should abort further init).
 */
export function checkBuildVersion(): boolean {
  const currentSha = typeof __APP_BUILD_SHA__ === "string" ? __APP_BUILD_SHA__.trim() : "";
  if (!currentSha || currentSha === "unknown") {
    // Dev server or missing git — skip check.
    return false;
  }
  try {
    const stored = sessionStorage.getItem(BUILD_SHA_KEY);
    sessionStorage.setItem(BUILD_SHA_KEY, currentSha);
    if (stored && stored !== currentSha) {
      // Build changed since last load in this tab — reload to pick up new assets.
      location.reload();
      return true;
    }
  } catch {
    // sessionStorage unavailable (private browsing edge cases) — skip.
  }
  return false;
}

/**
 * Called from the onHello handler after each WebSocket connect.
 * Compares the server-reported version against the last-seen value.
 *
 * Returns true if a reload was triggered.
 */
export function checkServerVersion(serverVersion: string | undefined): boolean {
  const version = serverVersion?.trim();
  if (!version || version === "dev") {
    return false;
  }
  try {
    const stored = sessionStorage.getItem(SERVER_VERSION_KEY);
    sessionStorage.setItem(SERVER_VERSION_KEY, version);
    if (stored && stored !== version) {
      location.reload();
      return true;
    }
  } catch {
    // sessionStorage unavailable — skip.
  }
  return false;
}
