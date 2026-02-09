import { s_attach } from "#app/Facade";
import ServeApp from "#serve/App";
import serve_hook from "#serve/hook";
import type ServeInit from "#serve/Init";

export default async (root: string, options: ServeInit) => {
  const facade = options.facade;

  const app = await new ServeApp(root, options).init() as ServeApp;

  facade[s_attach](app);
  return serve_hook(app);
};
