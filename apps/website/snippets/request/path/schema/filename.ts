import type { FileRef } from "@rcompat/fs";

export default (file: FileRef) => `routes/user/[id]${file.fullExtension}`;
