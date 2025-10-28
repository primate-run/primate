import type FileRef from "@rcompat/fs/FileRef";

export default (file: FileRef) => `config/database/index${file.fullExtension}`;
