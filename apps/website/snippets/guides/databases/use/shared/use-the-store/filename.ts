import type { FileRef } from "@rcompat/fs";

export default (file: FileRef) => `routes/users${file.fullExtension}`;
