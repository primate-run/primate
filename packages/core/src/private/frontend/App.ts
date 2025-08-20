// @ts-expect-error esbuild vfs
import * as frontends from "#frontends";

export default class App {
  start() {
    const hydration = document.getElementById("hydration")?.textContent;

    if (hydration !== undefined) {
      const { component, frontend, ...data } = JSON.parse(hydration);
      frontends[frontend]?.mount(component, data);
    }
  }
}
