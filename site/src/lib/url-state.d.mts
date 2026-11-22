export function readQueryValue(
  search: string,
  key: string,
  fallback: string,
  allowedValues?: readonly string[],
): string;

export function updateQueryString(
  search: string,
  updates: Record<string, string | null | undefined>,
  defaults?: Record<string, string | null | undefined>,
): string;

export function replaceQueryState(
  updates: Record<string, string | null | undefined>,
  defaults?: Record<string, string | null | undefined>,
  win?: Window,
): void;

export function subscribeQueryState(listener: () => void, win?: Window): () => void;
