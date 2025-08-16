import test from "primate/test";

const host = "http://localhost:10018";

/**
 * Build a Request with correct encoding for the given content type.
 * - text/plain: pass string as-is
 * - application/json: JSON.stringify if needed
 * - application/x-www-form-urlencoded: URLSearchParams encode
 * - multipart/form-data: use FormData; DO NOT set Content-Type
 */
function request(path, body, contentType = "text/plain", method = "POST") {
  const url = `${host}${path}`;
  const headers = {};
  let payload = body;

  switch (contentType) {
    case "application/json":
      payload = typeof body === "string" ? body : JSON.stringify(body);
      headers["Content-Type"] = contentType;
      break;

    case "application/x-www-form-urlencoded":
      payload =
        body instanceof URLSearchParams
          ? body.toString()
          : new URLSearchParams(body).toString();
      headers["Content-Type"] = contentType;
      break;

    case "multipart/form-data": {
      // Accept either a prebuilt FormData or a plain object
      if (body instanceof FormData) {
        payload = body;
      } else {
        const fd = new FormData();
        for (const [k, v] of Object.entries(body ?? {})) {
          // Strings like a real form; files/blobs should be appended by caller
          fd.append(k, v == null ? "" : String(v));
        }
        payload = fd;
      }
      // ❗ No Content-Type header here (boundary is added automatically)
      break;
    }

    default:
      if (contentType) headers["Content-Type"] = contentType;
  }

  return new Request(url, { body: payload, headers, method });
}

// --- existing tests ---

test.post(
  request("/body/text", "Hi!", "text/plain"),
  response => {
    response.body.equals("Hi!");
  },
);

test.post(
  request("/body/json", { baz: 1, foo: "bar" }, "application/json"),
  response => {
    response.body.equals({ baz: 1, foo: "bar" });
  },
);

test.post(
  request(
    "/body/form",
    { baz: "1", foo: "bar" },
    "application/x-www-form-urlencoded",
  ),
  response => {
    response.body.equals({ baz: "1", foo: "bar" });
  },
);

test.post(
  request(
    "/body/multipart",
    { baz: "1", foo: "bar" },
    "multipart/form-data",
  ),
  response => {
    response.body.equals({ baz: "1", foo: "bar" });
  },
);

{
  const fd = new FormData();
  fd.append("baz", "1");
  fd.append("foo", "bar");
  fd.append(
    "greeting",
    new File(["Hello from a file!"], "greeting.txt", { type: "text/plain" }),
  );
  test.post(
    request("/body/multipart-file", fd, "multipart/form-data"),
    async response => {
      const form = response.body;
      // Expected server-side parsing: fields + file info
      form.equals({
        baz: 1,
        foo: "bar",
        greeting: {
          content: "Hello from a file!",
          name: "greeting.txt",
          size: 18,
          type: "text/plain",
        },
      });
    },
  );
}
// --- binary: application/octet-stream ---
{
  // 6 bytes: 0xDE 0xAD 0xBE 0xEF 0x00 0x01
  const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x00, 0x01]);

  test.post(
    request("/body/binary", bytes, "application/octet-stream"),
    response => {
      response.body.equals({
        head: [222, 173, 190, 239], // first 4 bytes in decimal
        size: bytes.byteLength,
        type: "application/octet-stream",
      });
    },
  );
}

