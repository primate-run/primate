import type { FileRef } from "@rcompat/fs";

export default (file: FileRef) => `routes/search${file.fullExtension}`;
