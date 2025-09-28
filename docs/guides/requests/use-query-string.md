---
name: Use query string
---

Access query parameters from the request object. Query params are URL-decoded.

!!!
Use `.get()` for required params, `.try()` for optional.
!!!

---

### Access query params

Read query via `request.query`.

```ts
// routes/search.ts
import route from "primate/route";

route.get((request) => {
  const q = request.query.get("q");
  const limit = request.query.try("limit") ?? 10;
  return { q, limit };
});
```
