import E from "#i18n/errors";
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
    const at = path ? `${path}.${k}` : k;
    if (k.includes(".")) throw E.no_dots_catalog_keys(k, at, locale);
    validate(v, locale, at);
  }
}
