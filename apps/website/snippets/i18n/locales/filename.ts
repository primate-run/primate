import type FileRef from "@rcompat/fs/FileRef";

export default (file: FileRef) => {
  if (file.base === "German") return "locales/de-DE.ts";
  return "locales/en-US.ts";
};
