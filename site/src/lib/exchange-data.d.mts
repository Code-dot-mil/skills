import type { Skill } from "../components/SkillBrowser";
import type { Artifact, Finding, ScannerRun } from "../components/ScannerFindings";

export type ExchangeSkill = Skill & {
  content_hash: string;
  skill_md_content: string;
  skill_files: { path: string; size_bytes: number }[];
  download_path: string;
  first_observed: string | null;
  scan_mode: string;
  assessment_downloads: { skillspector: string; adjudication: string };
  adjudication: {
    status: string | null;
    summary: string | null;
    coverage_sufficient: boolean | null;
    coverage_reason: string | null;
    scope: string | null;
  };
  dispositions: { true_positive: number; false_positive: number; uncertain: number };
};

export const exchangeIndex: { skills: ExchangeSkill[]; version: string; revision: string };
export const scannerRunsTable: { rows: (ScannerRun & { skill_id: string })[] };
export const scannerFindingsTable: { rows: Finding[] };
export const scannerArtifactsTable: { rows: Artifact[] };

export const builtAt: string;
