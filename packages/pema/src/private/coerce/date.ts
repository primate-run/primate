const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
// time with optional :ss and .ms, but TZ is REQUIRED (Z or ±HH:MM)
const ISO_DATETIME_TZ =
  /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;
// signed integer
const INT = /^[+-]?\d+$/;

function epoch(n: number, digits?: number): Date | undefined {
  // For strings we use digit-count to choose s vs ms.
  // For numbers we ALWAYS treat as ms (no digits provided).
  const ms = digits !== undefined
    ? (digits >= 13 ? n : n * 1000)
    : n;

  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function fromNumber(n: number) {
  const date = epoch(n);
  return date !== undefined ? date : n;
}

function fromString(raw: string) {
  const s = raw.trim();
  if (s === "") return raw;

  // Integer string → epoch seconds or ms (based on digit count)
  if (INT.test(s)) {
    const digits = s[0] === "+" || s[0] === "-" ? s.length - 1 : s.length;
    const n = Number(s);
    const date = epoch(n, digits);
    return date ?? raw;
  }

  // ISO date-only → interpret as UTC midnight
  if (ISO_DATE.test(s)) {
    const date = new Date(`${s}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? raw : date;
  }

  // ISO datetime *with* timezone
  if (ISO_DATETIME_TZ.test(s)) {
    const date = new Date(s);
    return Number.isNaN(date.getTime()) ? raw : date;
  }

  return raw;
}

export default function coerceDate(x: unknown) {
  // Already a Date
  if (x instanceof Date) return x;

  // Numbers as treated as epochs
  if (typeof x === "number" && Number.isFinite(x)) {
    return fromNumber(x);
  }

  // strings
  if (typeof x === "string") {
    return fromString(x);
  }

  return x;
}
