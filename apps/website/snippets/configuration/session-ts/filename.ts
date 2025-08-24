import type FileRef from "@rcompat/fs/FileRef";

export default (file: FileRef) => `config/session${file.fullExtension}`;
