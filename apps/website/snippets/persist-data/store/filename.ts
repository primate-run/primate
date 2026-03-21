import type { FileRef } from "@rcompat/fs";

export default (file: FileRef) => `stores/Counter${file.fullExtension}`;
