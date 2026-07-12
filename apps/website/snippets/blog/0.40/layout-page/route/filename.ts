import type { FileRef } from "@rcompat/fs";

export default (file: FileRef) => `routes/admin/+layout${file.fullExtension}`;
