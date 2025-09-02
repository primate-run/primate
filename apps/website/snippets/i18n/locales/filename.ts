import type FileRef from "@rcompat/fs/FileRef";

export default (file: FileRef) => {
  if (file.base === "German") {
    return "locales/de-DE.json";
  }
  return "locales/en-US.json";
};
