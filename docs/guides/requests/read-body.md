---
name: Read body
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

### Form -> `Record`

Use `form()` to get the body as form (`Record<string, string | File>`).

[s=guides/requests/read-body/form-record]

---

### Binary -> `Blob`

Use `blods()` to get the body as binary (`Blob`).

[s=guides/requests/read-body/binary-blob]
