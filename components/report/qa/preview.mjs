import { mkdtempSync, readFileSync, writeFileSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const preview = mkdtempSync(join(tmpdir(), "son-report-qa-"));
const port = process.env.REPORT_PREVIEW_PORT || "3217";
mkdirSync(join(preview, "app"));
symlinkSync(join(root, "node_modules"), join(preview, "node_modules"), "dir");
writeFileSync(join(preview, "package.json"), JSON.stringify({ name: "son-report-qa", private: true }));
writeFileSync(join(preview, "tsconfig.json"), JSON.stringify({
  compilerOptions: { target: "ES2017", lib: ["dom", "dom.iterable", "esnext"], strict: true, skipLibCheck: true, noEmit: true, esModuleInterop: true, module: "esnext", moduleResolution: "bundler", resolveJsonModule: true, isolatedModules: true, jsx: "react-jsx", paths: { "@/*": [root + "/*"] } },
  include: ["**/*.ts", "**/*.tsx", ".next/types/**/*.ts"], exclude: ["node_modules"],
}));
writeFileSync(join(preview, "next.config.js"), `module.exports = { devIndicators: false, webpack(config) { config.resolve.alias['@'] = ${JSON.stringify(root)}; return config; } };`);
writeFileSync(join(preview, "app/layout.tsx"), `import type { ReactNode } from 'react'; import ${JSON.stringify(join(root, "styles/tokens.css"))}; import ${JSON.stringify(join(root, "styles/base.css"))}; export default function Layout({children}: {children: ReactNode}) { return <html lang="vi"><body>{children}</body></html>; }`);
writeFileSync(join(preview, "app/page.tsx"), readFileSync(join(here, "scenarios.tsx"), "utf8").replaceAll("@/", root + "/"));
console.log(`Report QA: http://127.0.0.1:${port} (isolated app; no production routes modified)`);
const child = spawn(process.execPath, [join(root, "node_modules/next/dist/bin/next"), "dev", "--webpack", "--hostname", "127.0.0.1", "--port", port], { cwd: preview, stdio: "inherit" });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code) => { rmSync(preview, { recursive: true, force: true }); process.exitCode = code ?? 0; });
child.on("error", (error) => { console.error(error.message); rmSync(preview, { recursive: true, force: true }); process.exitCode = 1; });
