const BLOCKED_ELEMENTS = /<(script|style|iframe|object|embed|svg|math)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const BLOCKED_SELF_CLOSING = /<(script|style|iframe|object|embed|svg|math)\b[^>]*\/?>/gi;
// One leading whitespace character avoids retrying every suffix of a whitespace run.
const EVENT_ATTRIBUTES = /\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const DANGEROUS_URLS = /\s(href|src)\s*=\s*("|')\s*(javascript:|data:text\/html)[\s\S]*?\2/gi;

export function sanitizeSkillHtml(html) {
  return String(html)
    .replace(BLOCKED_ELEMENTS, "")
    .replace(BLOCKED_SELF_CLOSING, "")
    .replace(EVENT_ATTRIBUTES, "")
    .replace(DANGEROUS_URLS, "");
}
