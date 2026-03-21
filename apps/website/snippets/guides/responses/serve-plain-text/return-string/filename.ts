import type { FileRef } from "@rcompat/fs";

export default (file: FileRef) => `routes/hello${file.fullExtension}`;
