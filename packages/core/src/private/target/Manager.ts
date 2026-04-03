import type App from "#App";
import E from "#errors";
import type Target from "#target/Target";

const web: Target = {
  name: "web",
  runner: () => { },
  target: "web",
};

export default class TargetManager {
  #name: string = "web";
  #targets: Target[] = [web];
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
