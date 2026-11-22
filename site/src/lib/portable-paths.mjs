// Astro's directory-format routes include a trailing slash during the build.
export function relativeSiteRoot(pathname) {
  const path = String(pathname).split(/[?#]/, 1)[0];
  const depth = path.split("/").filter(Boolean).length;
  return depth === 0 ? "./" : "../".repeat(depth);
}
