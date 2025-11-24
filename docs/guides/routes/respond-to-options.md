---
title: Respond to `OPTIONS` (CORS preflight)
---

APIs under `/api/*` might need to service CORS preflights. Reply with 204 and
the appropriate `Access-Control-*` headers.

!!!
Adjust `Access-Control-Allow-Origin` and headers to your needs.
!!!

---

### 1) Handle preflights for all /api/* paths

Define an `OPTIONS` route function.

```ts
// routes/api/[...segments].ts
import route from "primate/route";

route.options(() =>
  new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "600",
    },
  })
);
```

---

### 2) Add your actual handlers

Add substantive handlers.

```ts
import route from "primate/route";

route.get(() => "ok");
route.post(() => "ok");
```
