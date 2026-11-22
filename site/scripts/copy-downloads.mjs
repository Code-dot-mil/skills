import { cpSync, mkdirSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const generated = fileURLToPath(new URL("../../.exchange/generated", import.meta.url));
const target = fileURLToPath(new URL("../public/downloads", import.meta.url));
const index = JSON.parse(readFileSync(resolve(generated, "index.json"), "utf-8"));

rmSync(target, { force: true, recursive: true });
mkdirSync(target, { recursive: true });

for (const skill of index.skills) {
  copyDownload(skill.download_path, "zips", "downloads/");
  for (const filename of ["skillspector.json", "adjudication.json"]) {
    const key = filename.slice(0, -5);
    const download = skill.assessment_downloads[key];
    if (!download.endsWith(`/${filename}`)) throw new Error(`Unexpected assessment download: ${download}`);
    copyDownload(download, "assessments", "downloads/assessments/");
  }
}

function copyDownload(downloadPath, sourceDirectory, prefix) {
  if (typeof downloadPath !== "string" || !downloadPath.startsWith(prefix)) {
    throw new Error(`Expected download path starting with ${prefix}`);
  }
  const relative = downloadPath.slice(prefix.length);
  const sourceRoot = resolve(generated, sourceDirectory);
  const source = resolve(sourceRoot, relative);
  const destination = resolve(target, downloadPath.slice("downloads/".length));
  assertInside(source, sourceRoot, "download source is outside generated product data");
  assertInside(realpathSync(source), realpathSync(sourceRoot), "download source is outside generated product data");
  assertInside(destination, target, "download destination is outside public/downloads");
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination);
}

function assertInside(child, parent, message) {
  if (!child.startsWith(parent + sep)) throw new Error(`${message}: ${child}`);
}
