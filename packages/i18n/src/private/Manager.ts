import type Locales from "#Locales";
import log from "@primate/core/log";
import assert from "@rcompat/assert";

export default class Manager {
  #locale;
  #locales: Locales = {};

  constructor(locale: string) {
    this.#locale = locale;
  }

  init(locales: Locales) {
    assert(Object.keys(locales).length > 0, "empty locales object");
    assert(locales[this.#locale] !== undefined,
      "default locale not in locales");

    log.info("loaded {0}", Object.keys(locales).join(" "));

    this.#locales = {...locales};
  }

  get active() {
    return Object.keys(this.#locales).length > 0;
  }

  get locale() {
    return this.#locale;
  }

  get locales() {
    return this.#locales;
  }
}
