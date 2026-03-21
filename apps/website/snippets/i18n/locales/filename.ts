import type { FileRef } from "@rcompat/fs";

export default (file: FileRef) => {
  if (file.base === "German") return "locales/de-DE.ts";
  return "locales/en-US.ts";
};
