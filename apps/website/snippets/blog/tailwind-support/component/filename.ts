import type FileRef from "@rcompat/fs/FileRef";

export default (file: FileRef) => `views/Button${file.fullExtension}`;
