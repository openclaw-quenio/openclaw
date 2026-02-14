import { checkBuildVersion } from "./ui/build-version.ts";

// If the build SHA changed since the last load in this tab, reload immediately
// to pick up new content-hashed assets. Skip further initialization.
if (!checkBuildVersion()) {
  await import("./styles.css");
  await import("./ui/app.ts");
}
