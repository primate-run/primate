import type RequestBody from "@primate/core/request/RequestBody";
import type RequestFacade from "@primate/core/request/RequestFacade";
import type Dict from "@rcompat/type/Dict";

async function bridgeFields(body: RequestBody) {
  const fields = body.fields();

  const meta: Dict = Object.create(null);
  const files: Array<{
    bytes: Uint8Array;
    field: string;
    name: string;
    size: number;
    type: string;
  }> = [];

  const pending: Promise<void>[] = [];

  for (const [k, v] of Object.entries(fields)) {
    if (typeof v === "string") {
      meta[k] = v;
      continue;
    }

    // v is File
    const name = v.name;
    const type = v.type;
    const size = v.size;
    meta[k] = { name, size, type };

    // Precompute bytes so Go can call a SYNC getter
    pending.push(
      v.arrayBuffer().then(buffer => {
        files.push({
          bytes: new Uint8Array(buffer),
          field: k,
          name,
          size,
          type,
        });
      }),
    );
  }

  await Promise.all(pending);
  const jsonStr = JSON.stringify(meta);

  return {
    fieldsSync: () => jsonStr,
    filesSync: () => files,
    type: "fields" as const,
  };
}

async function bridgeBody(body: RequestBody) {
  const type = body.type;

  switch (type) {
    case "text": {
      const s: string = body.text();
      return { textSync: () => s, type };
    }
    case "json": {
      const val = body.json();
      const jsonStr = JSON.stringify(val);
      return { jsonSync: () => jsonStr, type };
    }
    case "fields": {
      return await bridgeFields(body);
    }
    case "bin": {
      const blob: Blob = body.binary();
      const buf = new Uint8Array(await blob.arrayBuffer()); // precompute bytes
      const mime = blob.type || "application/octet-stream";
      return {
        binarySync: () => buf,
        binaryTypeSync: () => mime,
        type,
      };
    }
    default:
      return { type: "none" as const };
  }
}

export default async function toRequest(request: RequestFacade) {
  const body = await bridgeBody(request.body);

  return {
    body,
    cookies: request.cookies.toJSON(),
    headers: request.headers.toJSON(),
    path: request.path.toJSON(),
    query: request.query.toJSON(),
    url: request.url,
  };
}
