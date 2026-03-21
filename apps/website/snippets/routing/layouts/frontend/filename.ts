import type { FileRef } from "@rcompat/fs";

export default (file: FileRef) => `views/layout${file.fullExtension}`;
