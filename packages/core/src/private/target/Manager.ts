import type App from "#App";
import E from "#errors";
import type Target from "#target/Target";
import runtime from "@rcompat/runtime";

const node: Target = {
  name: "node",
  runner: () => { },
  target: "node",
  conditions: ["node"],
  externals: ["node:*"],
};
const deno: Target = {
  name: "deno",
  runner: () => { },
  target: "deno",
  conditions: ["deno", "node"],
  externals: ["node:*"],
};
const bun: Target = {
  name: "bun",
  runner: () => { },
  target: "bun",
  conditions: ["bun", "node"],
  externals: ["bun:*", "node:*"],
};
const TARGETS = [node, deno, bun];

export default class TargetManager {
  #name: string = runtime.name;
  #targets: Target[] = [...TARGETS];
  #app: App;

  constructor(app: App) {
    this.#app = app;
  }

  get name() {
    return this.#name;
  }

  get target() {
    return this.get().target;
  }

  get conditions() {
    return this.get().conditions;
  }

  get externals() {
    return this.get().externals;
  }

  has(name: string) {
    return this.#targets
      .find(target => target.name === name) !== undefined;
  }

  get() {
    return this.#targets.find(target => target.name === this.#name)!;
  }

  set(name: string) {
    const targets = this.#targets;
    if (!this.has(name)) throw E.target_missing(name, targets.map(p => p.name));

    this.#name = name;
  }

  add(target: Target) {
    if (this.has(target.name)) throw E.target_duplicate(target.name);
    this.#targets.push(target);
  }

  async run() {
    await this.get().runner(this.#app);
  }
}
