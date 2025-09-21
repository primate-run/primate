import fail from "#fail";
import ordinals from "#i18n/ordinals";
import toIntlUnit from "#i18n/toIntlUnit";
import is from "@rcompat/assert/is";

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
    try {
      return new Intl.NumberFormat(this.#locale).format(number);
    } catch {
      return String(number);
    }
  }

  date(date: Date) {
    try {
      return new Intl.DateTimeFormat(this.#locale).format(date);
    } catch {
      return date.toString();
    }
  }

  currency(currency: string, amount: number) {
    const options = { style: "currency", currency } as const;
    try {
      return new Intl.NumberFormat(this.#locale, options).format(amount);
    } catch {
      return String(amount);
    }
  }

  ordinal(number: number) {
    try {
      const n = Math.trunc(number);
      const rules = new Intl.PluralRules(this.#locale, { type: "ordinal" });
      const category = rules.select(n);
      const language = this.#locale.split("-")[0];

      if (!(language in ordinals)) return String(n);

      const strategy = ordinals[language];
      const position = strategy.position;
      const pattern = strategy[category] || strategy.other;

      return position === "prefix" ? `${pattern}${n}` : `${n}${pattern}`;
    } catch {
      return String(Math.trunc(number));
    }
  }

  relative(milliseconds: number, options?: {
    numeric?: "always" | "auto";
    style?: "long" | "short" | "narrow";
  }) {
    const defaults = { numeric: "auto", style: "long", ...options } as const;

    try {
      const rtf = new Intl.RelativeTimeFormat(this.#locale, defaults);
      const s = Math.round(milliseconds / 1000);
      const abs = Math.abs(s);

      if (abs >= 31536000) return rtf.format(Math.trunc(s / 31536000), "year");
      if (abs >= 2592000) return rtf.format(Math.trunc(s / 2592000), "month");
      if (abs >= 604800) return rtf.format(Math.trunc(s / 604800), "week");
      if (abs >= 86400) return rtf.format(Math.trunc(s / 86400), "day");
      if (abs >= 3600) return rtf.format(Math.trunc(s / 3600), "hour");
      if (abs >= 60) return rtf.format(Math.trunc(s / 60), "minute");
      return rtf.format(s, "second");
    } catch {
      return `${milliseconds}ms`;
    }
  }

  list(items: string[]) {
    try {
      return new Intl.ListFormat(this.#locale).format(items);
    } catch {
      return items.join(", ");
    }
  }

  unit(value: number, u: string) {
    const unit = toIntlUnit(u);
    if (unit === undefined) throw fail("unit {0} not supported", u);

    const options = { style: "unit", unit } as const;
    try {
      return new Intl.NumberFormat(this.#locale, options).format(value);
    } catch {
      return `${value} ${u}`;
    }
  }

  pluralRules() {
    return new Intl.PluralRules(this.#locale);
  }
}
