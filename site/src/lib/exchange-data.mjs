import { readFileSync } from "node:fs";
import { root } from "astro:config/server";

const indexPath = new URL("../.exchange/generated/index.json", root);

export const builtAt = new Date().toISOString();
export const exchangeIndex = JSON.parse(readFileSync(indexPath, "utf-8"));
export const scannerRunsTable = { rows: exchangeIndex.skills.flatMap((skill) => skill.scanner_runs) };
export const scannerFindingsTable = { rows: exchangeIndex.skills.flatMap((skill) => skill.scanner_findings) };
export const scannerArtifactsTable = { rows: exchangeIndex.skills.flatMap((skill) => skill.scanner_artifacts) };
