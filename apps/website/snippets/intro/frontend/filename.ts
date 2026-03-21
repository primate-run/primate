import type { FileRef } from "@rcompat/fs";

export default (file: FileRef) => `views/Hello${file.fullExtension}`;
