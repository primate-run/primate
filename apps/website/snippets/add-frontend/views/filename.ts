import type FileRef from "@rcompat/fs/FileRef";

export default (file: FileRef) => `views/Counter${file.fullExtension}`;
