---
name: 404 fallback vs. `+error.ts`
---

Use a **rest route** for "not found" pages. Use **`+error.ts`** to handle errors thrown
by matched routes. Only the **nearest** `+error.ts` runs; error handlers don't compose.

!!!
404 fallback ≠ error handler. The fallback only runs when nothing else matched. `+error.ts`
runs when a matched route (or guard/layout) throws.
!!!

---

### 1) Not-found fallback (handles unmatched URLs)

Return a normal error response.

```ts
// routes/[[...path]].ts
import route from "primate/route";

route.get(() => new Response("Not found", { status: 404 }));
```

---

### 2) Error handler (handles thrown errors in matched routes)

`+error.ts` is triggered on any thrown errors within routes.

```ts
// routes/+error.ts
import route from "primate/route";
import redirect from "primate/response/redirect";

route.get(() => redirect("/")); // or return a rendered error view
```

---

### 3) When to use which

- Use the **fallback route** to show a friendly 404.
- Use **`+error.ts`** for exceptions/timeouts/validation errors in routes that
**did** match.
