import AppContext from "#context/app";
import locale_store from "#i18n/locale";
import resolve from "@primate/i18n/resolve";
import type Dict from "@rcompat/type/Dict";
import { useContext } from "solid-js";

export default (key: string, placeholders: Dict<string> = {}) => {
  locale_store.init();

  const { locale, locales } = useContext(AppContext)!.context().i18n;
  return resolve(locales[locale], key, placeholders);
};
