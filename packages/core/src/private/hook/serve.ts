import log from "#log";
import type Module from "#module/Module";
import type ServeApp from "#ServeApp";

const reducer = async (modules: Module[], app: ServeApp): Promise<ServeApp> => {
  if (modules.length === 0) {
    return app;
  }

  const [first, ...rest] = modules;

  if (rest.length === 0) {
    return await first.serve(app, _ => _);
  };
  return await first.serve(app, _ => reducer(rest, _));
};

function pre(app: ServeApp) {
  log.system("in startup");
  return app;
};

async function post(app: ServeApp) {
  await app.start();
  return app;
}

export default async (app: ServeApp) =>
  post(await reducer(app.modules, pre(app)));
