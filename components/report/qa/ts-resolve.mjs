// Test-only: registers the TS resolve hook so node --experimental-strip-types
// can load report components with bundler-style extensionless relative imports.
import { register } from "node:module";

register(new URL("./ts-resolve-hook.mjs", import.meta.url));
