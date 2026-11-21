/** Browser origins allowed when CORS_ORIGINS is not set: the web app's local dev server. */
export const DEFAULT_ALLOWED_ORIGINS: readonly string[] = ['http://localhost:3001'];

const EXAMPLE = 'e.g. CORS_ORIGINS=https://app.example.com,http://localhost:3001';

/**
 * Parses the CORS_ORIGINS setting into the exact origins browsers may call the API from.
 *
 * The value is a comma-separated list. Each entry is normalized to the form browsers send in the
 * `Origin` header (lowercase host, no trailing slash, no default port), because CORS only allows
 * exact matches.
 *
 * Misconfiguration throws instead of being ignored: a typo such as a path or a missing scheme
 * would otherwise silently block the web app in a deployed environment. A wildcard is rejected
 * so every environment lists the frontends it trusts.
 *
 * @param value Raw CORS_ORIGINS value; undefined or blank means {@link DEFAULT_ALLOWED_ORIGINS}.
 * @returns Unique allowed origins, in the order given.
 * @throws {Error} If an entry is `*` or not a bare http(s) origin.
 */
export function parseAllowedOrigins(value: string | undefined): string[] {
  const entries = (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');

  if (entries.length === 0) return [...DEFAULT_ALLOWED_ORIGINS];

  const origins = entries.map(toOrigin);
  return [...new Set(origins)];
}

/** Validates one CORS_ORIGINS entry and returns it in normalized origin form. */
function toOrigin(entry: string): string {
  if (entry === '*') {
    throw new Error(
      `CORS_ORIGINS must list allowed origins explicitly; "*" is not allowed (${EXAMPLE})`,
    );
  }

  let url: URL;
  try {
    url = new URL(entry);
  } catch {
    throw new Error(`Invalid CORS_ORIGINS entry "${entry}": not a URL (${EXAMPLE})`);
  }

  const isHttp = url.protocol === 'http:' || url.protocol === 'https:';
  const isBareOrigin =
    url.pathname === '/' &&
    url.search === '' &&
    url.hash === '' &&
    url.username === '' &&
    url.password === '';
  if (!isHttp || !isBareOrigin) {
    throw new Error(
      `Invalid CORS_ORIGINS entry "${entry}": use only scheme, host and optional port (${EXAMPLE})`,
    );
  }

  return url.origin;
}
