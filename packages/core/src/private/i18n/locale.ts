// primate/i18n/locale.ts
export type MessageMap = Record<string, string>;

export type LocaleOptions = {
  /** Optional explicit BCP-47 tag; defaults can be derived from filename */
  name?: string;
  /** Right-to-left script hint (for future dir="rtl" toggling) */
  rtl?: boolean;
  /** Optional fallback locale chain */
  fallback?: string;
  /** Free-form bag for per-locale knobs (currency, firstDayOfWeek, etc.) */
  [key: string]: unknown;
};

/**
 * Minimal identity helper that:
 * 1. Preserves the exact shape of the messages object at type level.
 * 2. Returns the object untouched at runtime.
 */
export default function locale<const M extends MessageMap>(
  messages: M,
  _options?: LocaleOptions,
): M {
  return messages;
}
