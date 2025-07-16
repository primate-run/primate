import locale_store from "#i18n/locale";
import resolve from "@primate/i18n/resolve";
import type Dict from "@rcompat/type/Dict";
import { derived } from "poly/store";

export default derived(locale_store, data =>
  (key: string, placeholders: Dict<string>) =>
    resolve(data.locales[data.locale], key, placeholders));
