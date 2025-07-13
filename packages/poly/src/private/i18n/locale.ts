import context_name from "#context-name";
import type ContextData from "@primate/i18n/ContextData";
import save from "@primate/i18n/save";
import { getContext } from "poly";
import { writable } from "poly/store";

type Context = {
  i18n: ContextData;
};

const store = writable("", set => {
  const { locale } = getContext<Context>(context_name).i18n;
  set(locale);

  return () => undefined;
});

export default {
  subscribe: store.subscribe,
  set: (locale: string) => {
    store.set(locale);
    save(locale);
  },
};
