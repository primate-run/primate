import type FileRef from "@rcompat/fs/FileRef";

export default (file: FileRef) => `routes/user/[id]${file.fullExtension}`;
