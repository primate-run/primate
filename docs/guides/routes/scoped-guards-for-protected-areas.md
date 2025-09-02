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

```ts
// routes/+guard.ts
import route from "primate/route";
import redirect from "primate/response/redirect";

route.get(req => {
  const ok = !!req.headers.get("Authorization");
  if (!ok) {
    return redirect(`/login?next=${encodeURIComponent(req.target)}`);
  }
  // explicit pass
  return null;
});
```

---

### 2) Tighten rules for a subtree (e.g., /admin/*)

```ts
// routes/admin/+guard.ts
import route from "primate/route";
import redirect from "primate/response/redirect";

route.get(req => {
  if (req.headers.get("X-Role") !== "admin") {
    return redirect("/"); // or return a 403 view/response
  }
  return null;
});
```
