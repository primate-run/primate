import serve from "#hook/serve";
import ServeApp from "#ServeApp";
import type ServeInit from "#ServeInit";

export default async (root: string, options: ServeInit) => {
  return serve(await new ServeApp(root, options).init() as ServeApp);
};
