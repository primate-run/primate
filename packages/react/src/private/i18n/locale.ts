import AppContext from "#context/app";
import save from "@primate/i18n/save";
import { useContext } from "react";

class Locale {
  #context;
  #setContext;

  constructor() {
    const { context, setContext } = useContext(AppContext);
    this.#context = context;
    this.#setContext = setContext;
  }

  get() {
    return this.#context.i18n.locale;
  }

  set(locale: string) {
    this.#setContext({
        ...this.#context,
        i18n: {
          locale,
          locales: this.#context.i18n.locales,
        },
      });
    save(locale);
  }
};

const $locale = Symbol("locale");

export default {
  [$locale]: undefined,

  get() {
    return this[$locale]!.get();
  },

  init() {
    if (this[$locale] === undefined) {
      this[$locale] = new Locale();
    }
  },

  set(name: string) {
    this[$locale]!.set(name);
  },
} satisfies {
  [$locale]?: Locale;
  get(): string;
  init(): void;
  set(locale: string): void;
};
