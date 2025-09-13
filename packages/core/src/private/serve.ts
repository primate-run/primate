import serve from "#hook/serve";
import ServeApp from "#ServeApp";
import type ServeInit from "#ServeInit";

export default async (root: string, options: ServeInit) => {
  const app = await new ServeApp(root, options)
    .init(options.platform) as ServeApp;
  return serve(app);
};
