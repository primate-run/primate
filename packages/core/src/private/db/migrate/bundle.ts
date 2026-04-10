import fs from "@rcompat/fs";
import esbuild from "esbuild";

export default async (contents: string) => {
  const root = await fs.project.root();
  const id = Date.now();
  const entrypoint = root.join(`.migrate-in-${id}.js`);
  const out = root.join(`.migrate-out-${id}.js`);
  await entrypoint.write(contents);

  try {
    esbuild.buildSync({
      entryPoints: [entrypoint.path],
      outfile: out.path,
      bundle: true,
      format: "esm",
      platform: "node",
      tsconfig: root.join("tsconfig.json").path,
    });
  } finally {
    await entrypoint.remove();
  }

  const result = await out.import("default");
  await out.remove();

  return result;
};
