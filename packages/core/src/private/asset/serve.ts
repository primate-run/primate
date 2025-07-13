import type FileRef from "@rcompat/fs/FileRef";
import Status from "@rcompat/http/Status";
import { resolve } from "@rcompat/http/mime";

export default (asset: FileRef): Response => new Response(asset.stream(), {
  status: Status.OK,
  headers: {
    "Content-Type": resolve(asset.name),
  },
});
