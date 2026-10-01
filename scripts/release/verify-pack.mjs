import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const packages = [
  { directory: "extension-api", name: "@uc-markdown-web/extension-api", value: "extensionApiVersion" },
  { directory: "core", name: "@uc-markdown-web/core", value: "corePackageName" },
  { directory: "markdown", name: "@uc-markdown-web/markdown", value: "markdownPackageName" },
  { directory: "extensions", name: "@uc-markdown-web/extensions", value: "extensionsPackageName" },
  { directory: "adapter-vanilla", name: "@uc-markdown-web/adapter-vanilla", value: "adapterVanillaPackageName" }
];

function fail(message) {
  throw new Error(message);
}

function tarEntries(tarball) {
  const archive = gunzipSync(tarball);
  const entries = new Map();

  for (let offset = 0; offset + 512 <= archive.length;) {
    const header = archive.subarray(offset, offset + 512);
    const name = header.subarray(0, 100).toString("utf8").replace(/\0.*$/, "");
    const prefix = header.subarray(345, 500).toString("utf8").replace(/\0.*$/, "");
    const sizeText = header.subarray(124, 136).toString("utf8").replace(/\0.*$/, "").trim();
    const size = sizeText ? Number.parseInt(sizeText, 8) : 0;
    const path = prefix ? `${prefix}/${name}` : name;

    if (!Number.isSafeInteger(size) || size < 0) {
      fail(`Invalid tar entry size for ${path}.`);
    }
    if (path) {
      entries.set(path, archive.subarray(offset + 512, offset + 512 + size));
    }
    offset += 512 + Math.ceil(size / 512) * 512;
  }

  return entries;
}

async function command(file, arguments_, options) {
  try {
    return await execFileAsync(file, arguments_, { ...options, shell: process.platform === "win32" && file === pnpmCommand, windowsHide: true });
  } catch (error) {
    const output = [error.stdout, error.stderr].filter(Boolean).join("\n");
    fail(`${file} ${arguments_.join(" ")} failed.\n${output}`);
  }
}

function inspectTarball(tarballPath, expected) {
  const entries = tarEntries(readFileSync(tarballPath));
  const manifestEntry = entries.get("package/package.json");
  if (!manifestEntry) {
    fail(`${basename(tarballPath)} does not include package/package.json.`);
  }

  const manifest = JSON.parse(manifestEntry.toString("utf8"));
  const importPath = manifest.exports?.["."]?.import;
  const typesPath = manifest.exports?.["."]?.types ?? manifest.types;
  const required = ["package/dist/index.js", "package/dist/index.d.ts"];

  for (const path of required) {
    if (!entries.has(path)) {
      fail(`${manifest.name} tarball is missing ${path}.`);
    }
  }
  if (manifest.name !== expected.name) {
    fail(`Expected ${expected.name}, received ${manifest.name}.`);
  }
  if (!/^0\./.test(manifest.version)) {
    fail(`${manifest.name} must retain a 0.x version for this validation.`);
  }
  if (importPath !== "./dist/index.js" || typesPath !== "./dist/index.d.ts") {
    fail(`${manifest.name} public entry points do not match dist/index files.`);
  }
  if (manifest.private !== true) {
    fail(`${manifest.name} must remain private until publication decisions are resolved.`);
  }
  for (const [dependency, specifier] of Object.entries(manifest.dependencies ?? {})) {
    if (packages.some((packageConfig) => packageConfig.name === dependency) && String(specifier).startsWith("workspace:")) {
      fail(`${manifest.name} tarball retains an unresolved workspace dependency for ${dependency}.`);
    }
  }

  return {
    name: manifest.name,
    version: manifest.version,
    tarball: basename(tarballPath),
    files: [...entries.keys()].sort(),
    metadata: {
      private: manifest.private,
      exports: manifest.exports,
      types: manifest.types,
      dependencies: manifest.dependencies ?? {},
      license: manifest.license ?? "BLOCKER: unset",
      repository: manifest.repository ?? "BLOCKER: unset",
      publication: "BLOCKER: npm organization, public package name, and publish permission are unresolved"
    }
  };
}

async function main() {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "uc-markdown-web-pack-"));
  const packDirectory = join(temporaryRoot, "tarballs");
  const consumerDirectory = join(temporaryRoot, "consumer");

  try {
    await mkdir(packDirectory);
    await mkdir(consumerDirectory);
    const evidence = [];
    for (const packageConfig of packages) {
      const packageDirectory = join(repositoryRoot, "packages", packageConfig.directory);
      await command(pnpmCommand, ["--dir", packageDirectory, "pack", "--pack-destination", packDirectory], { cwd: repositoryRoot });
      const tarballs = await readdir(packDirectory);
      const tarballPrefix = `${packageConfig.name.slice(1).replace("/", "-")}-`;
      const tarballName = tarballs.find((candidate) => candidate.endsWith(".tgz") && candidate.startsWith(tarballPrefix));
      if (!tarballName) {
        fail(`pnpm pack did not produce a tarball for ${packageConfig.name}.`);
      }
      evidence.push(inspectTarball(join(packDirectory, tarballName), packageConfig));
    }

    const localDependencies = Object.fromEntries(evidence.map(({ name, tarball }) => [name, `file:../tarballs/${tarball}`]));
    await writeFile(join(consumerDirectory, "package.json"), `${JSON.stringify({
      name: "uc-markdown-web-pack-consumer",
      private: true,
      type: "module",
      dependencies: localDependencies
    }, null, 2)}\n`);
    await writeFile(join(consumerDirectory, "pnpm-workspace.yaml"), `overrides:\n${Object.entries(localDependencies).map(([name, specifier]) => `  ${JSON.stringify(name)}: ${JSON.stringify(specifier)}`).join("\n")}\n`);
    await command(pnpmCommand, ["install"], { cwd: consumerDirectory });

    const javascriptImports = packages.map(({ name, value }) => `import { ${value} } from ${JSON.stringify(name)};`).join("\n");
    const javascriptChecks = packages.map(({ name, value }) => `if (typeof ${value} !== "string") throw new Error(${JSON.stringify(`${name} import failed.`)});`).join("\n");
    await writeFile(join(consumerDirectory, "consumer.mjs"), `${javascriptImports}\n${javascriptChecks}\nconsole.log("JavaScript imports passed.");\n`);
    await command(process.execPath, ["consumer.mjs"], { cwd: consumerDirectory });

    const typescriptImports = packages.map(({ name, value }) => `import { ${value} } from ${JSON.stringify(name)};`).join("\n");
    await writeFile(join(consumerDirectory, "consumer.ts"), `${typescriptImports}\nconst values: string[] = [${packages.map(({ value }) => value).join(", ")}];\nvoid values;\n`);
    await writeFile(join(consumerDirectory, "tsconfig.json"), `${JSON.stringify({ compilerOptions: { target: "ES2022", module: "NodeNext", moduleResolution: "NodeNext", strict: true, noEmit: true } }, null, 2)}\n`);
    await command(process.execPath, [join(repositoryRoot, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.json"], { cwd: consumerDirectory });

    console.log(JSON.stringify({ status: "PASS", temporaryRoot, packages: evidence, javascriptImport: "PASS", typescriptImport: "PASS" }, null, 2));
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
