---
name: Scoped guards for protected areas
---

Use `+guard.ts` to enforce auth globally or per-section. A guard
**passes only** when it **returns `null`**; any non-null return short-circuits
the route (e.g., redirect).

!!!
Execution order is top-down: parent guard -> child guard -> route.
!!!

---

### 1) Top guard (protect everything)

Create a top-level guard.

```ts
// routes/+guard.ts
import route from "primate/route";
import response from "primate/response";

route.get(request => {
  const ok = !!request.headers.get("Authorization");
  if (!ok) {
    return response.redirect(`/login?next=${encodeURIComponent(request.target)}`);
  }
  // pass through
  return null;
});
```

---

### Tighten rules for a subtree (e.g., /admin/*)

Create a subguard for the `admin` area; it executes only if the top guard let
through.

```ts
// routes/admin/+guard.ts
import route from "primate/route";
import response from "primate/response";

route.get(request => {
  if (request.headers.get("X-Role") !== "admin") {
    return response.redirect("/"); // or return a 403 view/response
  }

  // pass through
  return null;
});
```
