import { useMemo } from "react";

import LocalDate from "./LocalDate";
import { readQueryValue, replaceQueryState } from "../lib/url-state.mjs";
import { useQueryString } from "../lib/use-query-string";

export type Skill = {
  skill_id: string;
  name: string;
  description: string;
  category?: string;
  tags: string[];
  recommendation: string;
  recommendation_label?: string;
  risk?: string;
  risk_reason?: string;
  confidence_flags: string[];
  last_updated: string | null;
  last_scanned?: string | null;
  owner?: string;
  scanner_provenance?: {
    name?: string;
    version?: string;
    scan_mode?: string;
    provider?: string;
    model?: string;
  };
};

const SORT_VALUES = ["name", "recommendation", "last_updated", "last_scanned"];

function RecommendationPills({
  recommendation,
  label,
  flags,
}: {
  recommendation: string;
  label?: string;
  flags: string[];
}) {
  return (
    <span className="pill-row">
      <span className={`risk recommendation-${recommendation.toLowerCase().replaceAll("_", "-")}`}>
        {label || formatRecommendation(recommendation)}
      </span>
      {flags.map((flag) => (
        <span className="risk flag" key={flag}>
          {flag}
        </span>
      ))}
    </span>
  );
}

export default function SkillBrowser({ skills }: { skills: Skill[] }) {
  const search = useQueryString();

  // Keep ordering identical during static rendering and browser hydration.
  const categories = useMemo(
    () => Array.from(new Set(skills.map((skill) => skill.category || "uncategorized")))
      .sort((left, right) => {
        if (left === right) return 0;
        return left < right ? -1 : 1;
      }),
    [skills]
  );
  const categoryValues = useMemo(() => ["all", ...categories], [categories]);

  const query = readQueryValue(search, "q", "");
  const category = readQueryValue(search, "category", "all", categoryValues);
  const sort = readQueryValue(search, "sort", "name", SORT_VALUES);
  const updateFilters = (updates: Record<string, string>) => replaceQueryState(
    { q: query, category, sort, ...updates },
    { q: "", category: "all", sort: "name" }
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const recommendationRank: Record<string, number> = { DO_NOT_INSTALL: 3, CAUTION: 2, SAFE: 1, Unknown: 0 };
    return skills.filter((skill) => {
      const categoryMatches = category === "all" || (skill.category || "uncategorized") === category;
      const text = [skill.skill_id, skill.name, skill.description, skill.category, ...skill.tags].join(" ").toLowerCase();
      return categoryMatches && (!normalized || text.includes(normalized));
    }).sort((left, right) => {
      if (sort === "recommendation") {
        return (
          (recommendationRank[right.recommendation] ?? 0) - (recommendationRank[left.recommendation] ?? 0) ||
          left.skill_id.localeCompare(right.skill_id)
        );
      }
      if (sort === "last_updated") {
        const leftUpdated = left.last_updated ? Date.parse(left.last_updated) : -Infinity;
        const rightUpdated = right.last_updated ? Date.parse(right.last_updated) : -Infinity;
        return rightUpdated - leftUpdated || left.skill_id.localeCompare(right.skill_id);
      }
      if (sort === "last_scanned") {
        return Date.parse(right.last_scanned || "") - Date.parse(left.last_scanned || "") || left.skill_id.localeCompare(right.skill_id);
      }
      return left.skill_id.localeCompare(right.skill_id);
    });
  }, [category, query, skills, sort]);

  return (
    <section className="catalog-shell">
      <div className="catalog-summary">
        <div>
          <p className="eyebrow">Available skills</p>
          <h2>Assessed skills for mission work</h2>
        </div>
        <p>{filtered.length} of {skills.length} skills shown</p>
      </div>

      <div className="controls catalog-controls">
        <label>
          <span>Search</span>
          <input value={query} onChange={(event) => updateFilters({ q: event.target.value })} placeholder="Skill name, purpose, tag" />
        </label>
        <label>
          <span>Category</span>
          <select value={category} onChange={(event) => updateFilters({ category: event.target.value })}>
            <option value="all">All categories</option>
            {categories.map((item) => (
              <option value={item} key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Sort</span>
          <select value={sort} onChange={(event) => updateFilters({ sort: event.target.value })}>
            <option value="name">Name</option>
            <option value="recommendation">Recommendation</option>
            <option value="last_updated">Last updated</option>
            <option value="last_scanned">Last scanned</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No skills match those filters.</h3>
          <p>Clear the search or choose a broader category.</p>
        </div>
      ) : (
        <div className="skill-grid">
          {filtered.map((skill) => (
            <article className="skill-card" key={skill.skill_id}>
              <div className="skill-card-topline">
                <RecommendationPills
                  recommendation={skill.recommendation}
                  label={skill.recommendation_label}
                  flags={skill.confidence_flags}
                />
                <span className="category-chip">{skill.category || "uncategorized"}</span>
              </div>
              <h3><a href={`skills/${skill.skill_id}/`}>{skill.skill_id}</a></h3>
              <p>{skill.description}</p>
              {skill.tags.length > 0 && (
                <div className="tag-row">
                  {skill.tags.map((tag) => (
                    <span className="tag" key={tag}>{tag}</span>
                  ))}
                </div>
              )}
              <dl className="trust-list compact">
                <div>
                  <dt>Scanner</dt>
                  <dd>{skill.scanner_provenance?.name || "SkillSpector"}</dd>
                </div>
                <div>
                  <dt>Last scanned</dt>
                  <dd><LocalDate value={skill.last_scanned} /></dd>
                </div>
                <div className="trust-owner">
                  <dt>Owner</dt>
                  <dd>{skill.owner || "Not declared"}</dd>
                </div>
              </dl>
              <a className="card-action" href={`skills/${skill.skill_id}/`}>View skill instructions</a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function formatRecommendation(value: string) {
  if (value === "DO_NOT_INSTALL") {
    return "Avoid installing";
  }
  if (value === "CAUTION") {
    return "Human Review Advised";
  }
  if (value === "SAFE") {
    return "Safe to use";
  }
  if (value === "BLOCK") {
    return "Avoid installing";
  }
  return "Unknown";
}
