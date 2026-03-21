import type { FileRef } from "@rcompat/fs";

export default (file: FileRef) => `routes/api${file.fullExtension}`;
