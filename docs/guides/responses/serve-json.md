---
name: Serve JSON
---

Return objects to serve JSON responses. Primate automatically serializes
returned objects to JSON.

!!!
Objects are JSON-serialized; use `response.json()` for granular control.
!!!

### Return object

Primate sets `Content-Type: application/json` on returned objects and
serializes them to JSON strings.

```ts
// routes/api.ts
import route from "primate/route";

route.get(() => ({ message: "Hello", data: [1, 2, 3] }));
```

### Explicit JSON response

Use `response.json()` for custom options.

```ts
import response from "primate/response";

route.get(() => response.json({ error: "Not found" }, { status: 404 }));
```
