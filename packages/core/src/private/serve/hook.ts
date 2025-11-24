import log from "#log";
import reducer from "#reducer";
import type ServeApp from "#serve/App";

function pre(app: ServeApp) {
  log.system("in startup");
  return app;
};

async function post(app: ServeApp) {
  await app.start();
  return app;
}

export default async (app: ServeApp) =>
  post(await reducer(app.modules, pre(app), "serve"));
