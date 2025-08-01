// @ts-expect-error esbuild vfs
import * as frontends from "#frontends";

export default class App {
  start() {
    const hydration = document.getElementById("hydration");

    if (hydration !== null && hydration.textContent !== null) {
      const { component, frontend, ...data } = JSON.parse(hydration.textContent);
      frontends[frontend]?.mount(component, data);
    }
  }
}
