import type App from "#App";
import fail from "#fail";
import type Target from "#target/Target";
import web from "#target/web";

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
    if (!this.has(name)) {
      let message = "no target {0}, available targets {1}";
      if (this.#targets.length === 1) {
        message += "\n   - add {2} for more targets";
      }
      const targets = this.#targets.map(p => p.name).join(", ");
      throw fail(message, name, targets, "@primate/native");
    }

    this.#name = name;
  }

  add(target: Target) {
    if (this.has(target.name)) {
      throw fail("cannot add target {0} twice", target.name);
    }
    this.#targets.push(target);
  }

  async run() {
    await this.get().runner(this.#app);
  }
}
