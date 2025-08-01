import context_name from "#context-name";
import type Context from "#i18n/Context";
import save from "@primate/i18n/save";
import { getContext } from "svelte";
import { writable } from "svelte/store";

let init = false;

const store = writable("en-US", set => {
  if (!init) {
    set(getContext<Context>(context_name).i18n.locale);
    init = true;
  }
});

export default {
  set: (locale: string) => {
    store.set(locale);
    save(locale);
  },
  subscribe: store.subscribe,
};
