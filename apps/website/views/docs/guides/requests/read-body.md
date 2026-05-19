---
title: Read request body
---

Access the request body by calling methods on `request.body`. Methods validate
that the body is of the correct type.

---

### Text -> `string`

Use `text()` to get the body as a `string`.

[s=guides/requests/read-body/text-string]

---

### JSON -> `Record`

Use `json()` to get the body as JSON (`Record`).

[s=guides/requests/read-body/json-record]

---

### Form -> `Record<string, string>`

Use `form()` to get the body as a form (`Record<string, string>`).

[s=guides/requests/read-body/form-record]

---

### Multipart -> `Record<string, string | File>`

Use `multipart()` to get the body as a multpart form
(`Record<string, string | File>`).

[s=guides/requests/read-body/multipart-record]

---

### Binary -> `Blob`

Use `binary()` to get the body as binary (`Blob`).

[s=guides/requests/read-body/binary-blob]
