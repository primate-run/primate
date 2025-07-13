import context_name from "#context-name";
import type Context from "#i18n/Context";
import locale_store from "#i18n/locale";
import resolve from "@primate/i18n/resolve";
import type Dictionary from "@rcompat/type/Dictionary";
import { getContext } from "poly";
import { derived } from "poly/store";

export default derived(locale_store, locale =>
  (key: string, placeholders: Dictionary<string>) => {
    console.log(locale, getContext<Context>(context_name));
    const { locales } = getContext<Context>(context_name).i18n;
    return resolve(locales[locale], key, placeholders);
  });
