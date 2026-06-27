import type BuildApp from "#build/App";
import type { Plugin } from "esbuild";

export default function plugin_server_migrations(app: BuildApp): Plugin {
  return {
    name: "primate/server/migrations",
    setup(build) {
      build.onResolve({ filter: /^app:migrations$/ }, () => {
        return { path: "migrations-virtual", namespace: "primate-migrations" };
      });

      build.onResolve({ filter: /^app:migrations\/autoapply$/ }, () => {
        return { path: "migrations-autoapply", namespace: "primate-migrations" };
      });

      build.onLoad({ filter: /^migrations-autoapply$/, namespace: "primate-migrations" }, () => {
        return {
          contents: `export { default } from "#db/migrate/autoapply";`,
          loader: "js",
          resolveDir: import.meta.dirname,
        };
      });

      build.onLoad({ filter: /^migrations-virtual$/, namespace: "primate-migrations" }, async () => {
        const dir = app.root.join("migrations");
        const files = await dir.exists()
          ? await dir.files({ filter: /\d+-.*\.[jt]s$/ })
          : [];
        const migrations = files
          .map(file => ({ file, n: parseInt(file.name.split("-")[0]) }))
          .toSorted((a, b) => a.n - b.n);

        const imports = migrations.map(({ file }, i) =>
          `import migration${i} from ${JSON.stringify(file.path)};`,
        ).join("\n");
        const entries = migrations.map(({ file, n }, i) =>
          `[${n}, ${JSON.stringify(file.name)}, migration${i}]`,
        ).join(",\n");

        return {
          contents: `${imports}\nexport default [${entries}];`,
          loader: "js",
          resolveDir: app.root.path,
        };
      });
    },
  };
}
