import type FileRef from "@rcompat/fs/FileRef";

export default (file: FileRef) => `components/Counter${file.fullExtension}`;
