import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

/**
 * Custom ESM Loader cho node --loader / module.register
 * Giúp resolve tự động các relative import không có đuôi .ts / .tsx
 * mà không làm ảnh hưởng tới next build hay tsconfig.json.
 */
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") || specifier.startsWith("/")) {
    const parentDir = context.parentURL ? path.dirname(fileURLToPath(context.parentURL)) : process.cwd();
    const candidatePath = path.resolve(parentDir, specifier);

    for (const ext of [".ts", ".tsx", ".js", ".mjs"]) {
      if (fs.existsSync(candidatePath + ext)) {
        return {
          shortCircuit: true,
          url: pathToFileURL(candidatePath + ext).href,
        };
      }
      if (fs.existsSync(path.join(candidatePath, "index" + ext))) {
        return {
          shortCircuit: true,
          url: pathToFileURL(path.join(candidatePath, "index" + ext)).href,
        };
      }
    }
  }

  return nextResolve(specifier, context);
}
