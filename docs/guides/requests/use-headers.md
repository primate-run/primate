---
name: Use headers
---

Access HTTP headers from the request object. Headers are parsed from the
request.

### Read headers

Access headers via `request.headers`.

```ts
// routes/index.ts
import route from "primate/route";

route.get((request) => {
  const userAgent = request.headers.get("User-Agent");
  const contentType = request.headers.get("Content-Type");
  return { userAgent, contentType };
});
```

### Set headers in response

Use `response` with headers option.

```ts
import route from "primate/route";
import response from "primate/response";

route.get(() => {
  return response("Hello", { headers: { "X-Custom": "value" } });
});
```
