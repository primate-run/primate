---
title: Serve JSON
---

Return objects to serve JSON responses. Primate automatically serializes
returned objects to JSON.

!!!
Objects are JSON-serialized; use `response.json()` for granular control.
!!!

---

### Return object

Primate sets `Content-Type: application/json` on returned objects and
serializes them to JSON strings.

[s=guides/responses/serve-json/return-object]

---

### Explicit JSON response

Use `response.json()` for custom options.

[s=guides/responses/serve-json/explicit-json-response]
