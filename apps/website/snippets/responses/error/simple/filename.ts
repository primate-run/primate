import type FileRef from "@rcompat/fs/FileRef";

export default (file: FileRef) => `routes/not-found${file.fullExtension}`;
