import { transformSync } from "@babel/core";
import transform from "@primate/core/build/transform";
// @ts-expect-error no types
import fs from "@rcompat/fs";
import solid from "babel-preset-solid";

function compile(text) {
  return (
    transformSync(
      transform(text, {
        format: "esm",
        jsx: "preserve",
        loader: "tsx",
        target: "esnext",
      }).code,
      { presets: [solid] }
    )?.code ?? ""
  );
}


const files = await fs.ref(import.meta.dirname)
  .join("../lib/private/i18n")
  .files();

for (const file of files) {
  if (file.path.endsWith(".jsx")) {
    file.bare(".js").write(compile(await file.text()));
  }
}
