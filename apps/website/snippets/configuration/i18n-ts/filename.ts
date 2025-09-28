import type FileRef from "@rcompat/fs/FileRef";

export default (file: FileRef) => `config/i18n{file.fullExtension}`;
