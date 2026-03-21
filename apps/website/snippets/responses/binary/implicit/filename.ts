import type { FileRef } from "@rcompat/fs";

export default (file: FileRef) => `routes/binary${file.fullExtension}`;
