import type { FileRef } from "@rcompat/fs";

export default function filename(file: FileRef) {
  return `routes/admin/+layout${file.fullExtension}`;
}
