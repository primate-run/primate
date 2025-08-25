import escape from "@rcompat/html/escape";
import type Dict from "@rcompat/type/Dict";

const TAGS = ["script", "style", "template", "textarea"];
const token = (i: number) => `__SLOT_${i}__`;

function shield(html: string) {
  const slots: string[] = [];
  const re = new RegExp(`<(?:${TAGS.join("|")})\\b[^>]*>[\\s\\S]*?<\\/(?:${TAGS.join("|")})>`, "gi");
  const code = html.replace(re, m => (slots.push(m), token(slots.length - 1)));
  return {
    code,
    restore: (s: string) => s.replace(/__SLOT_(\d+)__/g, (_, n) => slots[+n]),
  };
}

function interpolate(template: string, props: Dict) {
  let out = "", i = 0;

  while (i < template.length) {
    const j = template.indexOf("${", i);
    if (j === -1) { out += template.slice(i); break; }
    out += template.slice(i, j);

    // brace/quote-aware scan
    let k = j + 2, depth = 1, quote: null | string = null, esc = false;
    while (k < template.length && depth > 0) {
      const ch = template[k++];
      if (quote) {
        if (esc) esc = false;
        else if (ch === "\\") esc = true;
        else if (ch === quote) quote = null;
      } else {
        if (ch === "'" || ch === "\"" || ch === "`") quote = ch;
        else if (ch === "{") depth++;
        else if (ch === "}") depth--;
      }
    }
    if (depth) throw new Error("Unbalanced ${...} expression in template");
    const expr = template.slice(j + 2, k - 1);

    // evaluate with props in scope (non-strict by default)
    const value = Function("p", `with (p) { return (${expr}); }`)(props);
    out += String(value);
    i = k;
  }
  return out;
}

/**
 * Render an HTML template with ${...} interpolation outside shielded tags.
 * - Shield <script>/<style>/<template>/<textarea> so their contents are kept
 * - Deep-escape all string values in props before interpolation
 * - Authors can write \${...} (outside shields) to emit a literal ${...}
 */
export default function render(template: string, props: Dict): string {
  const XXX = `__LBRACE_${Math.random().toString(36).slice(2)}__`;

  // shield first so we don't touch \${ inside scripts/styles/etc.
  const { code, restore } = shield(template);

  // replace \${ with a placeholder in non-shielded content
  const outside = code.replace(/\\\$\{/g, XXX);

  // deep-escape all strings in props (JSON-serializable only)
  let safe: Dict;
  try {
    safe = JSON.parse(escape(JSON.stringify(props)));
  } catch {
    throw new Error("render(): props must be JSON-serializable for escaping");
  }

  // null-prototype view to avoid prototype lookups in `with`
  const p = Object.assign(Object.create(null), safe);

  // interpolate & restore
  const interpolated = interpolate(outside, p);
  const restored = restore(interpolated);

  // put back literal \${ sequences
  return restored.split(XXX).join("${");
}
