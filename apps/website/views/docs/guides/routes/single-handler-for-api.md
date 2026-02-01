---
title: Single handler for `/api/*`
---

Prototype quickly by fanning in your API under one file with a rest segment and
branching on `request.method` and the captured path.

!!!
Great for small APIs; easy to split into dedicated files as the surface grows.
!!!

---

### 1) Capture the remaining path

Create a unified resolver for a request facade.

```ts
// routes/api/[...segments].ts
import route from "primate/route";
import type { RequestFacade } from "primate/request";

function path(request: RequestFacade) {
  return request.path.get("segments"); // e.g., "users/42"
}
```
---

### 2) Dispatch per method (and optionally by path)

Expose API verbs.

```ts
route.get(req => `GET /api/${path(req)}`);
route.post(req => `POST /api/${path(req)}`);
route.put(req => `PUT /api/${path(req)}`);
route.delete(req => `DELETE /api/${path(req)}`);
// Example branching by prefix:
// if (path(request).startsWith("users/")) { ... }
```
