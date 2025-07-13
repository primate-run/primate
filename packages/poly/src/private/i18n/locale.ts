import context_name from "#context-name";
import type Context from "#i18n/Context";
import type ContextData from "@primate/i18n/ContextData";
import save from "@primate/i18n/save";
import { getContext } from "poly";
import { writable } from "poly/store";

const store = writable<ContextData>({ locale: "en-US", locales: {} }, set => {
  const { i18n } = getContext<Context>(context_name);
  set(i18n);
});

export default {
  subscribe: store.subscribe,
  set: (locale: string) => {
    store.update(previous => {
      previous.locale = locale;
      return {
        locale: locale,
        locales: previous.locales,
      };
    });
    save(locale);
  },
};
