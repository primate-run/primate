import type FileRef from "@rcompat/fs/FileRef";

export default (file: FileRef) => {
  if (file.base === "German") {
    return "locales/de-DE.js";
  }
  return "locales/en-US.js";
};
