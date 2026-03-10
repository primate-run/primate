import type ServeApp from "#serve/App";

export default async function run_serve_hooks(app: ServeApp) {
  await app.serve_hooks(app);
  await app.start();
  return app;
}
