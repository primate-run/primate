import type { FileRef } from "@rcompat/fs";

export default (file: FileRef) => `views/Button${file.fullExtension}`;
