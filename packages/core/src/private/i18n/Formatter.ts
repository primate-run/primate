import is from "@rcompat/assert/is";
import type Dict from "@rcompat/type/Dict";

function toIntlUnit(unit: string): Intl.NumberFormatOptions["unit"] {
  const map: Dict<string> = {
    "km/h": "kilometer-per-hour",
    "m/s": "meter-per-second",
    "°c": "celsius",
    "°f": "fahrenheit",
  };
  return map[unit.toLowerCase()] ?? unit;
}

export default class Formatter {
  #locale: string;

  constructor(locale: string) {
    is(locale).string();

    this.#locale = locale;
  }

  get locale() {
    return this.#locale;
  }

  set locale(locale: string) {
    is(locale).string();
    this.#locale = locale;
  }

  number(number: number) {
    try { return new Intl.NumberFormat(this.#locale).format(number); }
    catch { return String(number); }
  };

  date(date: Date) {
    try { return new Intl.DateTimeFormat(this.#locale).format(date); }
    catch { return date.toString(); }
  }

  currency(currency: string, amount: number) {
    const options = { style: "currency", currency } as const;

    try { return new Intl.NumberFormat(this.#locale, options).format(amount); }
    catch { return String(amount); }
  }

  ordinal(number: number) {
    try {
      const rules = new Intl.PluralRules(this.#locale, { type: "ordinal" });
      const cat = rules.select(number);
      const suffix =
        cat === "one"
          ? "st" : cat === "two"
            ? "nd" : cat === "few"
              ? "rd" : "th"
        ;
      return `${number}${suffix}`;
    } catch {
      return String(number);
    }
  }

  relative(seconds: number) {
    const options = { numeric: "auto" } as const;

    try {
      const rtf = new Intl.RelativeTimeFormat(this.#locale, options);
      const s = Math.round(seconds);
      const abs = Math.abs(s);
      if (abs >= 86400) return rtf.format(Math.trunc(s / 86400), "day");
      if (abs >= 3600) return rtf.format(Math.trunc(s / 3600), "hour");
      if (abs >= 60) return rtf.format(Math.trunc(s / 60), "minute");
      return rtf.format(s, "second");
    } catch {
      return `${seconds}s`;
    }
  }

  list(items: unknown) {
    const array = Array.isArray(items) ? (items as string[]) : [];

    try { return new Intl.ListFormat(this.#locale).format(array); }
    catch { return array.join(", "); }
  }

  unit(value: number, unit: string) {
    const options = { style: "unit", unit: toIntlUnit(unit) } as const;
    try { return new Intl.NumberFormat(this.#locale, options).format(value); }
    catch { return String(value); }
  }

  pluralRules() {
    return new Intl.PluralRules(this.#locale);
  }
}
