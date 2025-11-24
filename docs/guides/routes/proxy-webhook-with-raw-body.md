---
title: Proxy webhook with raw body (no parsing)
---

Forward inbound webhooks **unchanged** to an upstream service by disabling body
parsing and using `request.forward`.

!!!
With `{ parseBody: false }`, `request.body` is `null` and the original stream
is forwarded as-is.
!!!

---

### Disable parsing and forward

Pass `{ parseBody: false }` as the second parameter of the route function.

```ts
// routes/webhook.ts
import route from "primate/route";

route.post(
  request => request.forward("https://upstream.example.com/webhooks/provider"),
  { parseBody: false },
);
```

---

### Gate by provider IP/secret before forwarding

Add a check before forwarding upstream.

```ts
// routes/webhook.ts
import route from "primate/route";

route.post(request => {
  if (request.headers.get("X-Secret") !== process.env.WEBHOOK_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }
  return request.forward("https://upstream.example.com/webhooks/provider");
}, { parseBody: false });
```
