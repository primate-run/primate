import context_name from "#context-name";
import type Context from "#i18n/Context";
import locale_store from "#i18n/locale";
import resolve from "@primate/i18n/resolve";
import type Dict from "@rcompat/type/Dict";
import { getContext } from "svelte";
import { derived } from "svelte/store";

export default derived(locale_store, locale =>
  (key: string, placeholders: Dict<string> = {}) => {
    const { locales } = getContext<Context>(context_name).i18n;
    return resolve(locales[locale]!, key, placeholders);
  });
