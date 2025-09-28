---
name: Serve plain text
---

Return strings to serve plain text responses. Primate sets
`Content-Type: text/plain` on returned string.

!!!
Strings are served as text; use `response.text()` for granular control.
!!!

---

### Return string

Primate sets `Content-Type: text/plain` on returned string.

[s=guides/responses/serve-plain-text/return-string]

---

### Explicit text response

Use `response.text()` for custom options.

[s=guides/responses/serve-plain-text/explicit-text-response]

---

### Custom content type

Specify MIME type.

[s=guides/responses/serve-plain-text/custom-content-type]
