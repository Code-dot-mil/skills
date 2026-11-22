import { useMemo, useRef, useState } from "react";

import { readQueryValue, replaceQueryState } from "../lib/url-state.mjs";
import LocalDate from "./LocalDate";
import { useQueryString } from "../lib/use-query-string";

export type ScannerRun = {
  id: string;
  scanner_name: string;
  scanner_version: string;
  scan_mode: string;
  native_score?: number;
  native_severity?: string;
  last_scanned?: string;
  llm_provider?: string;
  llm_model?: string;
  display_risk?: string;
  confidence_flags?: string[];
  content_hash?: string;
};

export type Finding = {
  id: string;
  scanner_run_id: string;
  native_issue_id: string;
  severity?: string;
  category?: string;
  pattern?: string;
  path?: string;
  start_line?: number;
  explanation?: string;
  remediation?: string;
  code_snippet?: string;
  false_positive?: boolean;
};

export type Artifact = {
  scanner_run_id: string;
  artifact_kind: string;
  download_path: string;
};

const RUNS_VALUES = ["latest", "all"];

export default function ScannerFindings({
  scannerRuns,
  scannerFindings,
  scannerArtifacts,
}: {
  scannerRuns: ScannerRun[];
  scannerFindings: Finding[];
  scannerArtifacts: Artifact[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const sortedRuns = useMemo(
    () => [...scannerRuns].sort((left, right) => Date.parse(right.last_scanned || "") - Date.parse(left.last_scanned || "")),
    [scannerRuns]
  );
  const defaultRun = sortedRuns[0];
  const runIds = useMemo(() => sortedRuns.map((run) => run.id), [sortedRuns]);
  const search = useQueryString();
  const selectedRunId = readQueryValue(search, "run", defaultRun?.id || "", runIds);
  const showOlderRuns = readQueryValue(search, "runs", "latest", RUNS_VALUES) === "all"
    || Boolean(selectedRunId && selectedRunId !== defaultRun?.id);
  const [copyError, setCopyError] = useState(false);
  const selectedRun = sortedRuns.find((run) => run.id === selectedRunId) || sortedRuns[0];
  const displayedRuns = showOlderRuns ? sortedRuns : sortedRuns.slice(0, 1);
  const olderRunCount = Math.max(sortedRuns.length - 1, 0);
  // Keep ordering identical during static rendering and browser hydration.
  const severities = useMemo(
    () =>
      Array.from(
        new Set(
          scannerFindings
            .filter((finding) => finding.scanner_run_id === selectedRun?.id)
            .map((finding) => finding.severity)
            .filter((severity): severity is string => Boolean(severity))
        )
      ).sort((left, right) => {
        if (left === right) return 0;
        return left < right ? -1 : 1;
      }),
    [scannerFindings, selectedRun?.id]
  );
  const severity = readQueryValue(search, "severity", "all", ["all", ...severities]);
  const updateFilters = (updates: Record<string, string>) => replaceQueryState(
    { run: selectedRunId, runs: showOlderRuns ? "all" : "latest", severity, ...updates },
    { run: defaultRun?.id || "", runs: "latest", severity: "all" }
  );

  const visibleFindings = scannerFindings.filter((finding) => {
    if (finding.scanner_run_id !== selectedRun?.id) {
      return false;
    }
    return severity === "all" || finding.severity === severity;
  });

  if (!selectedRun) {
    return (
      <section className="card">
        <h2>Scanner Run</h2>
        <p>No scanner runs are available.</p>
      </section>
    );
  }

  return (
    <>
      <section className="card">
        <div className="section-title-row">
          <div className="title-cluster">
            <h2>Scanner Run</h2>
            <button className="icon-button" type="button" onClick={() => dialogRef.current?.showModal()} aria-label="About the scanner run">
              i
            </button>
          </div>
        </div>
        <dialog ref={dialogRef}>
          <form method="dialog">
            <button className="dialog-close" type="submit" aria-label="Close">Close</button>
          </form>
          <h2>Scanner Run</h2>
          <p>The skill review process has four stages.</p>
          <ol className="review-workflow" aria-label="Review progression">
            <li><strong>Static Checks</strong><span>Pattern matchers look for warning signs.</span></li>
            <li><strong>AI-assisted Checks</strong><span>AI flags warnings it can't confirm are true positives.</span></li>
            <li><strong>Adjudication</strong><span>AI judges findings to be true positives, false positives, or inconclusive.</span></li>
            <li><strong>Human Review</strong><span>A person reads the AI judge's summary, reviews the evidence, and decides whether to approve the skill as Safe to Use.</span></li>
          </ol>
          <p>SkillSpector can run without AI, using only the first stage of static checks. We don't recommend this. Static-only results are difficult for a person to review on their own.</p>
          <p><strong>Scanner risk</strong> is SkillSpector's overall rating across all findings. A finding's <strong>risk tag</strong> rates that warning alone, so it can differ from the overall rating.</p>
          <p>Both risks are calculated before adjudication and do not reflect the AI judge's decisions. The <strong>adjudicated recommendation</strong> is the final risk judgment.</p>
          <p>Adjudication adds an <strong>Adjudicated as False Positive</strong> tag to warnings it judges to be false alarms.</p>
          <p>Human review takes place during the code merge process, when a person approves adding the skill to the exchange.</p>
          <p>Learn more:</p>
          <ul>
            <li><a className="external-link" href="https://github.com/NVIDIA/SkillSpector" target="_blank" rel="noreferrer" referrerPolicy="no-referrer">SkillSpector on GitHub <span aria-hidden="true">↗</span></a></li>
            <li><a className="external-link" href="https://docs.nvidia.com/skills/scanning-agent-skills" target="_blank" rel="noreferrer" referrerPolicy="no-referrer">How skill scanning works <span aria-hidden="true">↗</span></a></li>
            <li><a className="external-link" href="https://github.com/NVIDIA/SkillSpector/blob/v2.12.0/README.md#risk-scoring" target="_blank" rel="noreferrer" referrerPolicy="no-referrer">How risk scores are calculated <span aria-hidden="true">↗</span></a></li>
          </ul>
        </dialog>
        <table>
          <thead>
            <tr>
              <th>Scanner</th>
              <th>Last Scanned Date</th>
              <th>Content Hash</th>
              <th>Score</th>
              <th>Risk</th>
              <th>Findings</th>
              <th>Evidence</th>
            </tr>
          </thead>
          <tbody>
            {displayedRuns.map((run) => {
              const nativeReport = scannerArtifacts.find(
                (artifact) => artifact.scanner_run_id === run.id && artifact.artifact_kind === "native_report"
              );
              const findingCount = scannerFindings.filter((finding) => finding.scanner_run_id === run.id).length;
              return (
                <tr key={run.id}>
                  <td>
                    {olderRunCount > 0 ? (
                      <button
                        className="row-select"
                        type="button"
                        aria-label={`View findings for ${run.scanner_name} ${run.scanner_version}, ${run.last_scanned || "date unknown"}`}
                        onClick={() => updateFilters({ run: run.id, severity: "all" })}
                      >
                        {run.scanner_name} {run.scanner_version}
                      </button>
                    ) : <>{run.scanner_name} {run.scanner_version}</>}
                  </td>
                  <td><LocalDate value={run.last_scanned} /></td>
                  <td>
                    <span className="hash-cell">
                      <abbr title={run.content_hash}><code>{run.content_hash?.slice(0, 12)}</code></abbr>
                      {run.content_hash && (
                        <button
                          className="icon-button compact"
                          type="button"
                          title="Copy content hash"
                          aria-label="Copy content hash"
                          onClick={(event) => {
                            event.stopPropagation();
                            setCopyError(false);
                            try {
                              navigator.clipboard.writeText(run.content_hash || "").catch(() => setCopyError(true));
                            } catch {
                              setCopyError(true);
                            }
                          }}
                        >
                          copy
                        </button>
                      )}
                    </span>
                  </td>
                  <td>{run.native_score ?? "n/a"}</td>
                  <td>{run.display_risk || "Unknown"}</td>
                  <td>{findingCount}</td>
                  <td>
                    {nativeReport && (
                      <a className="icon-link" href={nativeReport.download_path} title="Download scanner output" aria-label={`Download ${run.scan_mode} scanner output`} onClick={(event) => event.stopPropagation()}>
                        <span aria-hidden="true">&#8681;</span>
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {copyError && <p role="status">Could not copy the content hash. Check clipboard permissions and try again.</p>}
        {olderRunCount > 0 && (
          <div className="centered-action">
            <button
              className="link-button"
              type="button"
              onClick={() => {
                updateFilters(showOlderRuns
                  ? { runs: "latest", run: defaultRun.id, severity: "all" }
                  : { runs: "all" });
              }}
            >
              {showOlderRuns ? "Hide older scanner runs" : "View older scanner runs"}
            </button>
          </div>
        )}
      </section>

      <section className="card">
        <div className="section-title-row">
          <h2>Findings</h2>
        </div>
        <p>
          <strong>Scanner risk:</strong>{" "}
          <RiskPills risk={selectedRun.display_risk || "Unknown"} flags={selectedRun.confidence_flags || []} />
        </p>
        <div className="controls">
          <select value={severity} onChange={(event) => updateFilters({ severity: event.target.value })}>
            <option value="all">All finding severities</option>
            {severities.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        {visibleFindings.length === 0 ? (
          <p>No findings were reported for the selected scan and risk filter.</p>
        ) : (
          <div className="finding-list">
            {visibleFindings.map((finding) => {
              const location = finding.path ? `${finding.path}:${finding.start_line || "?"}` : "Unknown";
              return (
                <article className="finding-card" key={finding.id}>
                  <header className="finding-card-header">
                    <div>
                      <strong>{finding.native_issue_id}</strong>
                      <span className="muted"> {finding.category || "Uncategorized"}</span>
                    </div>
                    <span className="pill-row">
                      <span className={`risk risk-${String(finding.severity || "unknown").toLowerCase()}`}>
                        {finding.severity || "Unknown"}
                      </span>
                      {finding.false_positive && <span className="risk flag">Adjudicated as False Positive</span>}
                    </span>
                  </header>
                  <p><strong>{finding.pattern || "Finding"}</strong></p>
                  <p>{finding.explanation || "No explanation provided."}</p>
                  <p><strong>Location:</strong> <code>{location}</code></p>
                  {finding.code_snippet && <pre><code>{finding.code_snippet}</code></pre>}
                  <p><strong>Remediation:</strong> {finding.remediation || "No remediation provided."}</p>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

function RiskPills({ risk, flags }: { risk: string; flags: string[] }) {
  return (
    <span className="pill-row inline-pills">
      <span className={`risk risk-${risk.toLowerCase()}`}>{risk}</span>
      {flags.map((flag) => (
        <span className="risk flag" key={flag}>
          {flag}
        </span>
      ))}
    </span>
  );
}
