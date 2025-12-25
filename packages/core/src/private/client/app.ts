// @ts-expect-error esbuild vfs
import stamp from "server:stamp";
// @ts-expect-error esbuild vfs
(0, () => stamp)();
// @ts-expect-error esbuild vfs
import * as frontends from "app:frontends";

class ClientApp {
  start() {
    const hydration = document.getElementById("hydration")?.textContent;

    if (hydration !== undefined) {
      const { component, frontend, ...data } = JSON.parse(hydration);
      frontends[frontend]?.mount(component, data);
    }
  }
}

const app = new ClientApp();
app.start();
