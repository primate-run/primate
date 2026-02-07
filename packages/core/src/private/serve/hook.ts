import log from "#log";
import reducer from "#reducer";
import type ServeApp from "#serve/App";

async function post(app: ServeApp) {
  await app.start();
  return app;
}

export default async (app: ServeApp) =>
  post(await reducer(app.modules, app, "serve"));
