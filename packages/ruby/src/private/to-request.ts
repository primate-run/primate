import type RequestBody from "@primate/core/request/RequestBody";
import type RequestFacade from "@primate/core/request/RequestFacade";
import type Dict from "@rcompat/type/Dict";

type FileEntry = {
  bytes: Uint8Array;
  field: string;
  name: string;
  size: number;
  type: string;
};

function plainUrl(u: URL) {
  return {
    href: u.href,
    origin: u.origin,
    protocol: u.protocol,
    username: u.username,
    password: u.password,
    host: u.host,
    hostname: u.hostname,
    port: u.port,
    pathname: u.pathname,
    search: u.search,
    hash: u.hash,
  };
}

function toDict(obj: Record<string, unknown> | URLSearchParams): Dict {
  const out: Dict = Object.create(null);
  if (obj instanceof URLSearchParams) {
    obj.forEach((v, k) => {
      if (!(k in out)) out[k] = v ?? "";
    });
  } else {
    for (const [k, v] of Object.entries(obj)) {
      out[k] = v == null ? "" : String(v);
    }
  }
  return out;
}

async function bridge_form(body: RequestBody) {
  const plain: Record<string, string> = Object.create(null);
  const files: FileEntry[] = [];
  const pending: Promise<void>[] = [];

  for (const [k, v] of Object.entries(body.form())) {
    plain[k] = v;
  }
  const form = JSON.stringify(plain);

  for (const [k, v] of Object.entries(body.files())) {
    const name = v.name;
    const type = v.type;
    const size = v.size;
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

  return {
    form: () => form,
    files: () => files,
  };
}

async function bridgeBody(body: RequestBody) {
  let form, buffer: Uint8Array<ArrayBuffer>, blob: Blob;
  if (body.type === "form") {
    form = await bridge_form(body);
  }
  if (body.type === "binary") {
    blob = body.binary();
    buffer = new Uint8Array(await blob.arrayBuffer());
  }
  return {
    text: () => body.text(),
    json: () => {
      return JSON.stringify(body.json());
    },
    form: () => form!.form(),
    files: () => form!.files(),
    binary: () => {
      const mime = blob.type || "application/octet-stream";
      return {
        buffer,
        mime,
      };
    },
    none: () => null,
  };
}

export default async function to_request(request: RequestFacade) {
  const body = await bridgeBody(request.body);

  // these must be plain objects of strings, not JSON strings
  const cookies = toDict(request.cookies.toJSON());
  const headers = toDict(request.headers.toJSON());
  const path = toDict(request.path.toJSON());
  const query = toDict(request.query.toJSON());

  // build the plain-url object Ruby expects
  const u = request.url as unknown as URL;
  const url = plainUrl(new URL(String(u)));

  return {
    url,                 // plain object
    body,                // has .call(name)
    path, query, headers, cookies, // plain dicts
  };
}
