import E from "#errors";
import type Module from "#Module";
import assert from "@rcompat/assert";
import fs from "@rcompat/fs";

type Loader = "file";

export default function loader(extension: string, loader: Loader) {
  assert.true(loader === "file", E.build_unrecognized_loader(loader));

  const name = `loader-${extension}`;
  const filter = new RegExp(`\\.${extension}$`);
  const Loader: Module = {
    name,

    setup({ onBuild }) {
      onBuild(async app => {
        app.plugin("client", {
          name: "static-loader",
          setup(build) {
            build.onLoad({ filter }, async args => {
              return {
                contents: await fs.bytes(args.path),
                loader: "file",
              };
            });
          },
        });
      });
    },
  };

  return Loader;
}
