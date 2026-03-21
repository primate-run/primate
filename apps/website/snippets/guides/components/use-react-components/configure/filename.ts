import type { FileRef } from "@rcompat/fs";

export default (file: FileRef) => `config/app${file.fullExtension}`;
