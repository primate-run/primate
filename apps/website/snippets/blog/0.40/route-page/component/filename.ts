import type { FileRef } from "@rcompat/fs";

const extensions = new Map([
  [".component.ts", ".component.ts"],
  [".marko", ".marko"],
  [".tsx", ".tsx"],
  [".svelte", ".svelte"],
  [".vue", ".vue"],
]);

export default (file: FileRef) =>
  `routes/post/[id]${extensions.get(file.fullExtension)}`;
