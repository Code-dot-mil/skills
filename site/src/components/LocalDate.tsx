import { useSyncExternalStore } from "react";

import { formatDate } from "../lib/format-date.mjs";

const subscribe = () => () => {};
const browserSnapshot = () => true;
const serverSnapshot = () => false;

export default function LocalDate({ value }: { value?: string | null }) {
  const localized = useSyncExternalStore(subscribe, browserSnapshot, serverSnapshot);

  if (!value) return <span>Unknown</span>;

  // Keep the static page and first hydration render identical. After mounting,
  // use the browser's locale and timezone; without JS the labeled UTC date remains.
  const options = localized ? undefined : { locale: "en-US", timeZone: "UTC" };
  return <time dateTime={value}>{formatDate(value, options)}</time>;
}
