import type { Dict } from "@rcompat/type";

export default function frontmatter(src: string): {
  body: string;
  meta: Dict | null;
} {
  const input = src.replace(/^\uFEFF/, "");
  const match = input.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (match === null) return {
    body: input,
    meta: null,
  };

  const raw = match[1].trim();
  const body = input.slice(match[0].length);

  // Try JSON first
  try {
    return { body, meta: JSON.parse(raw) };
  } catch { /* fall through */ }

  // Minimal key: value parser (not YAML; single-line only)
  const meta: Dict = {};
  for (const line of raw.split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;
    const i = s.indexOf(":");
    if (i < 0) continue;
    const key = s.slice(0, i).trim();
    const val = s.slice(i + 1).trim();

    // quoted strings
    if ((val.startsWith("\"") && val.endsWith("\""))
      || (val.startsWith("'") && val.endsWith("'"))) {
      meta[key] = val.slice(1, -1);
      continue;
    }

    // booleans / numbers
    if (/^(true|false)$/i.test(val)) {
      meta[key] = /^true$/i.test(val);
      continue;
    }
    if (/^-?\d+(\.\d+)?$/.test(val)) {
      meta[key] = Number(val);
      continue;
    }

    meta[key] = val; // fallback string
  }

  return { body, meta };
}
