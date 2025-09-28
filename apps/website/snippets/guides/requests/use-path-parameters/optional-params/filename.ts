import type FileRef from "@rcompat/fs/FileRef";

export default (file: FileRef) => `routes/user/[[name]]${file.fullExtension}`;
