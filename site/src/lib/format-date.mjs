/** Omitted locale and timezone use the viewer's browser settings. */
export function formatDate(value, { locale, timeZone } = {}) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone,
  }).format(new Date(value));
}
