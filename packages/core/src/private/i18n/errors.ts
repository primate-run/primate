import error from "@rcompat/error";

const t = error.template;

function unit_not_supported(unit: string) {
  return t`unit ${unit} not supported`;
}
function at_least_one_locale() {
  return t`must have at least 1 locale`;
}
function missing_default_locale(locales: string[]) {
  return t`missing default locale, locales: ${locales}`;
}
function unused_default_locale(locale: string, locales: string[]) {
  return t`default locale ${locale} not in locales ${locales}`;
}
function no_dots_catalog_keys(key: string, at: string, locale: string) {
  return t`dots are not allowed in catalog key names. Found ${key} at ${at} (locale ${locale})`;
}
const errors = error.coded({
  at_least_one_locale,
  missing_default_locale,
  unused_default_locale,
  unit_not_supported,
  no_dots_catalog_keys,
});

export type Code = keyof typeof errors;
export const Code = Object.fromEntries(
  Object.keys(errors).map(k => [k, k])) as { [K in Code]: K };

export default errors;
