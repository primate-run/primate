import type { FileRef } from "@rcompat/fs";

export default (file: FileRef) => `routes/not-found${file.fullExtension}`;
