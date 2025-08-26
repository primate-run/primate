import type FileRef from "@rcompat/fs/FileRef";

export default (file: FileRef) => `components/layout${file.fullExtension}`;
