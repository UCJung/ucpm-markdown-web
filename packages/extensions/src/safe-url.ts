const CONTROL_OR_WHITESPACE = /[\u0000-\u0020\u007f-\u009f\s]/u;
const ALLOWED_SCHEMES = new Set(["http", "https", "mailto"]);

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: "&",
  colon: ":",
  tab: "\t",
  newline: "\n",
  quot: "\"",
  apos: "'"
};

/**
 * Decodes the entity forms that can hide a URL scheme before validation.
 * This deliberately does not normalize whitespace: any decoded whitespace is unsafe.
 */
export function decodeUrlEntities(value: string): string {
  let decoded = value;

  for (let pass = 0; pass < 3; pass += 1) {
    const next = decoded.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/giu, (entity, token: string) => {
      if (token.startsWith("#x") || token.startsWith("#X")) {
        return fromCodePoint(Number.parseInt(token.slice(2), 16), entity);
      }
      if (token.startsWith("#")) {
        return fromCodePoint(Number.parseInt(token.slice(1), 10), entity);
      }
      return NAMED_ENTITIES[token.toLowerCase()] ?? entity;
    });

    if (next === decoded) {
      return next;
    }
    decoded = next;
  }

  return decoded;
}

/**
 * Allows HTTP(S), mailto, relative paths, queries, and fragments only.
 * Protocol-relative URLs and every control- or whitespace-obfuscated value are rejected.
 */
export function isSafeUrl(value: string): boolean {
  const decoded = decodeUrlEntities(value);
  const navigationPath = decoded.replace(/\\/gu, "/");
  if (decoded.length === 0 || CONTROL_OR_WHITESPACE.test(decoded) || navigationPath.startsWith("//")) {
    return false;
  }

  const scheme = decoded.match(/^([a-z][a-z0-9+.-]*):/iu)?.[1]?.toLowerCase();
  return scheme === undefined || ALLOWED_SCHEMES.has(scheme);
}

function fromCodePoint(value: number, fallback: string): string {
  if (!Number.isInteger(value) || value < 0 || value > 0x10ffff) {
    return fallback;
  }

  return String.fromCodePoint(value);
}
