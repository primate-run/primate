import is from "@rcompat/is";

export default function validate(
  key: unknown,
  locale: string,
  path = "",
): void {
  if (Array.isArray(key)) {
    for (let i = 0; i < key.length; i++) {
      validate(key[i], locale, `${path}.${i}`);
    }
    return;
  }

  if (!is.dict(key)) return;

  for (const [k, v] of Object.entries(key)) {
    if (k.includes(".")) {
      const at = path ? `${path}.${k}` : k;
      throw new Error(
        "[i18n] Dots are not allowed in catalog key names. " +
        `Found "${k}" at "${at}" (locale "${locale}").`,
      );
    }
    const next = path ? `${path}.${k}` : k;
    validate(v, locale, next);
  }
}
