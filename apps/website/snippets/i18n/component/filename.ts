import type FileRef from "@rcompat/fs/FileRef";

export default (file: FileRef) => `components/Translated${file.fullExtension}`;
