import type FileRef from "@rcompat/fs/FileRef";

export default (file: FileRef) => `routes/search${file.fullExtension}`;
