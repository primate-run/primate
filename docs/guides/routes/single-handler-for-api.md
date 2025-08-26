---
name: Single handler for `/api/*`
---

Prototype quickly by fanning in your API under one file with a rest segment and branching
on `req.method` and the captured path.

!!!
Great for small APIs; easy to split into dedicated files as the surface grows.
!!!

---

### 1) Capture the remaining path

```ts
// routes/api/[...segments].ts
import route from "primate/route";

function path(req: Request) {
  return req.path.get("segments"); // e.g., "users/42"
}
```
---

### 2) Dispatch per method (and optionally by path)

```ts
route.get(req => `GET /api/${path(req)}`);
route.post(req => `POST /api/${path(req)}`);
route.put(req => `PUT /api/${path(req)}`);
route.delete(req => `DELETE /api/${path(req)}`);
// Example branching by prefix:
// if (path(req).startsWith("users/")) { ... }
```

