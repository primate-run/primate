import type { FileRef } from "@rcompat/fs";

export default (file: FileRef) => `views/Welcome${file.fullExtension}`;
