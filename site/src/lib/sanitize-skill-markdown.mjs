import { visit } from "unist-util-visit";

export function sanitizeSkillMarkdown() {
  return (tree) => {
    visit(tree, (node) => {
      // Keep skill-supplied HTML inert before Astro parses raw HTML.
      if (node.type === "raw") node.type = "text";
      if (node.type !== "element" || node.tagName !== "a") {
        return;
      }
      node.tagName = "span";
      delete node.properties?.href;
      delete node.properties?.target;
      delete node.properties?.rel;
    });
  };
}
