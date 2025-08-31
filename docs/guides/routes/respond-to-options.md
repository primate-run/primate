---
name: Respond to `OPTIONS` (CORS preflight)
---

APIs under `/api/*` should answer CORS preflights. Reply with 204 and the appropriate
`Access-Control-*` headers.

!!!
Adjust `Access-Control-Allow-Origin` and headers to your needs.
!!!

---

### 1) Handle preflights for all /api/* paths

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

```ts
route.get(() => "ok");
route.post(() => "ok");
```
