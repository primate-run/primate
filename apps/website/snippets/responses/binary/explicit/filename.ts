import type FileRef from "@rcompat/fs/FileRef";

export default (file: FileRef) => `routes/binary${file.fullExtension}`;
