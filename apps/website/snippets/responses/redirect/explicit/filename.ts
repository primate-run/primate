import type FileRef from "@rcompat/fs/FileRef";

export default (file: FileRef) => `routes/redirect${file.fullExtension}`;
