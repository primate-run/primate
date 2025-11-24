import ServeApp from "#serve/App";
import serve from "#serve/hook";
import type ServeInit from "#serve/Init";

export default async (root: string, options: ServeInit) => {
  return serve(await new ServeApp(root, options).init() as ServeApp);
};
