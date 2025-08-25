import type FileRef from "@rcompat/fs/FileRef";

export default (file: FileRef) => `routes/ws${file.fullExtension}`;
