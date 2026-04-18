import type {
  RequestBody,
  RequestContentType,
  RequestFacade,
} from "@primate/core";

type FileEntry = {
  bytes: Uint8Array;
  field: string;
  name: string;
  size: number;
  type: string;
};

type BridgedBody =
  | { type: "json"; jsonSync: () => string }
  | { type: "text"; textSync: () => string }
  | { type: "form"; formSync: () => string }
  | { type: "multipart"; formSync: () => string; filesSync: () => FileEntry[] }
  | { type: "blob"; blobSync: () => Uint8Array; blobTypeSync: () => string }
  | { type: "none" };

async function bridge_body(body: RequestBody, contentType: RequestContentType | ""): Promise<BridgedBody> {
  switch (contentType) {
    case "text/plain": {
      const s = await body.text();
      return { type: "text", textSync: () => s };
    }
    case "application/json": {
      const val = await body.json();
      return { type: "json", jsonSync: () => JSON.stringify(val) };
    }
    case "application/x-www-form-urlencoded": {
      const form = await body.form();
      return { type: "form", formSync: () => JSON.stringify(form) };
    }
    case "multipart/form-data": {
      const { form, files } = await body.multipart();
      const pending: Promise<void>[] = [];
      const bridgedFiles: FileEntry[] = [];

      for (const [field, file] of Object.entries(files)) {
        const name = file.name;
        const type = file.type;
        const size = file.size;
        pending.push(
          file.arrayBuffer().then(buffer => {
            bridgedFiles.push({ bytes: new Uint8Array(buffer), field, name, size, type });
          }),
        );
      }

      await Promise.all(pending);
      return { type: "multipart", formSync: () => JSON.stringify(form), filesSync: () => bridgedFiles };
    }
    case "application/octet-stream": {
      const blob = await body.blob();
      const buf = new Uint8Array(await blob.arrayBuffer());
      return { type: "blob", blobSync: () => buf, blobTypeSync: () => blob.type || "application/octet-stream" };
    }
    default:
      return { type: "none" };
  }
}

export default async function to_request(request: RequestFacade, contentType: RequestContentType | "") {
  const body = await bridge_body(request.body, contentType);

  return {
    url: request.url,
    body,
    path: request.path.toJSON(),
    query: request.query.toJSON(),
    headers: request.headers.toJSON(),
    cookies: request.cookies.toJSON(),
  };
}
