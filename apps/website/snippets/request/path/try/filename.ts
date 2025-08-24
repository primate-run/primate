import type FileRef from "@rcompat/fs/FileRef";

export default (file: FileRef) =>
  `routes/blog/[year]/[[slug]]${file.fullExtension}`;
