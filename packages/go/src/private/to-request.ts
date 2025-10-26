import type RequestBody from "@primate/core/request/RequestBody";
import type RequestFacade from "@primate/core/request/RequestFacade";
import type Dict from "@rcompat/type/Dict";

async function bridge_form(body: RequestBody) {
  const meta: Dict = Object.create(null);
  const files: Array<{
    bytes: Uint8Array;
    field: string;
    name: string;
    size: number;
    type: string;
  }> = [];

  const pending: Promise<void>[] = [];

  for (const [k, v] of Object.entries(body.form())) {
    meta[k] = v;
  }

  for (const [k, v] of Object.entries(body.files())) {
    const name = v.name;
    const type = v.type;
    const size = v.size;
    meta[k] = { name, size, type };

    // precompute bytes so Go can call a SYNC getter
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
    formSync: () => jsonStr,
    filesSync: () => files,
    type: "form" as const,
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
    case "form": {
      return await bridge_form(body);
    }
    case "binary": {
      const blob: Blob = body.binary();
      const buf = new Uint8Array(await blob.arrayBuffer());
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
    cookies: JSON.stringify(request.cookies.toJSON()),
    headers: JSON.stringify(request.headers.toJSON()),
    path: JSON.stringify(request.path.toJSON()),
    query: JSON.stringify(request.query.toJSON()),
    searchParams: JSON.stringify(request.url.searchParams),
    url: request.url,
  };
}
