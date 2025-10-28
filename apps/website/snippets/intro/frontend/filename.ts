import type FileRef from "@rcompat/fs/FileRef";

export default (file: FileRef) => `views/Hello${file.fullExtension}`;
