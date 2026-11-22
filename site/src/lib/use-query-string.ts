import { useSyncExternalStore } from "react";
import { subscribeQueryState } from "./url-state.mjs";

const browserSearch = () => window.location.search;
const serverSearch = () => "";

export function useQueryString() {
  return useSyncExternalStore(subscribeQueryState, browserSearch, serverSearch);
}
