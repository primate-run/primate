import type FileRef from "@rcompat/fs/FileRef";

export default (file: FileRef) => `stores/User${file.fullExtension}`;
