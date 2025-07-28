import type App from "#App";
import AppError from "#AppError";
import type Platform from "#platform/Platform";
import web from "#platform/web";

export default class PlatformManager {
  #name: string = "web";
  #platforms: Platform[] = [web];
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
    return this.#platforms
      .find(platform => platform.name === name) !== undefined;
  }

  get() {
    return this.#platforms.find(platform => platform.name === this.#name)!;
  }

  set(name: string) {
    if (!this.has(name)) {
      let message = "no platform {0}, available platforms {1}";
      if (Object.keys(this.#platforms).length === 1) {
        message += "\n   - add {2} for more platforms";
      }
      const platforms = Object.keys(this.#platforms).join(", ");
      throw new AppError(message, name, platforms, "@primate/native");
    }

    this.#name = name;
  }

  add(platform: Platform) {
    if (this.has(platform.name)) {
      throw new AppError("Cannot add platform {0} twice", platform.name);
    }
    this.#platforms.push(platform);
  }

  async run() {
    await this.get().runner(this.#app);
  }
}
