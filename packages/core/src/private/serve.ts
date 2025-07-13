import serve from "#hook/serve";
import ServeApp from "#ServeApp";
import type ServeOptions from "#ServeOptions";

export default async (root: string, options: ServeOptions) =>
  serve(await new ServeApp(root, options).init());
