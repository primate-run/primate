import type { FileRef } from "@rcompat/fs";

export default (file: FileRef) =>
  `routes/blog/[year]/[[slug]]${file.fullExtension}`;
