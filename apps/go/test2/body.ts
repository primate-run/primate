import test from "primate/test";

const host = "http://localhost:10003";

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
      //  No Content-Type header here (boundary is added automatically)
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
