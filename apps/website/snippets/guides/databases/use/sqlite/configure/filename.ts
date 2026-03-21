import type { FileRef } from "@rcompat/fs";

export default (file: FileRef) => `config/db/index${file.fullExtension}`;
