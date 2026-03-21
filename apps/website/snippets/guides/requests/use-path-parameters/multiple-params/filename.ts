import type { FileRef } from "@rcompat/fs";

export default (file: FileRef) =>
  `routes/user/[id]/posts/[post_id]${file.fullExtension}`;
