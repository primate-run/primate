import type FileRef from "@rcompat/fs/FileRef";

export default (file: FileRef) => `components/Hello${file.fullExtension}`;
