import type Formatter from "#i18n/Formatter";
import type { Dict } from "@rcompat/type";

export default function format(
  input: string,
  params: Dict,
  currency: string,
  formatter: Formatter): string {
  let template = input;
  // save escaped braces
  template = template.replace(/\{\{/g, "\uE000");
  template = template.replace(/\}\}/g, "\uE001");

  // Process normal parameters with nested brace support
  const template_re = /\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
  template = template.replace(template_re, (_, body: string) => {
    // name[:spec]
    let name = body;
    let spec: string | undefined;
    const colon = body.indexOf(":");
    if (colon >= 0) {
      name = body.slice(0, colon);
      spec = body.slice(colon + 1);
    }

    const value = params[name];

    if (!spec) return value == null ? "" : String(value);

    // number selection: "n|one|other" or "n|zero|one|other"
    const bar = spec.indexOf("|");
    const head = (bar === -1 ? spec : spec.slice(0, bar)).toLowerCase();
    const tail = bar === -1 ? "" : spec.slice(bar + 1);

    // units u(...)/unit(...)
    const m = /^(?:u|unit)\(([^)]+)\)$/.exec(head);
    if (m) return formatter.unit(Number(value ?? 0), m[1]);

    switch (head) {
      case "n":
      case "number": {
        if (tail) {
          const options = tail.split("|");
          const n = Number(value ?? 0);
          const formatted = formatter.number(n);
          const plural = () => {
            const category = Number.isFinite(n)
              ? formatter.pluralRules().select(n)
              : "other";
            if (options.length === 2) {
              const [one, other] = options;
              return category === "one" ? one : other;
            }
            if (options.length === 3) {
              const [zero, one, other] = options;
              return n === 0 ? zero : (category === "one" ? one : other);
            }
            if (options.length === 5) {
              const [zero, one, few, many, other] = options;
              if (n === 0) return zero;
              switch (category) {
                case "one": return one;
                case "few": return few;
                case "many": return many;
                default: return other;
              }
            }
            return formatted;
          };
          return plural().replace(new RegExp(`\\{${name}\\}`, "g"), formatted);
        }
        return formatter.number(Number(value ?? 0));
      }

      case "d":
      case "date": {
        const d = typeof value === "number"
          ? new Date(value)
          : value instanceof Date ? value : new Date(NaN);
        return formatter.date(d);
      }

      case "c":
      case "currency":
        return formatter.currency(currency, Number(value ?? 0));

      case "o":
      case "ordinal":
        return formatter.ordinal(Number(value ?? 0));

      case "a":
      case "ago":
        return formatter.relative(Number(value ?? 0));

      case "l":
      case "list":
        return formatter.list(Array.isArray(value) ? value : []);

      default:
        return value == null ? "" : String(value);
    }
  });

  // restore escaped braces
  template = template.replace(/\uE000/g, "{");
  template = template.replace(/\uE001/g, "}");

  return template;
}
