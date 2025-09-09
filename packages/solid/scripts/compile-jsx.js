import { transformSync } from "@babel/core";
import transform from "@rcompat/build/sync/transform";
// @ts-expect-error no types
import FileRef from "@rcompat/fs/FileRef";
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


const files = await new FileRef(import.meta.dirname).join("../lib/private/i18n").list();

for (const file of files) {
  if (file.path.endsWith(".jsx")) {
    file.bare(".js").write(compile(await file.text()));
  }
}
