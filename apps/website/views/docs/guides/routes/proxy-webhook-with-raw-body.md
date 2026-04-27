---
title: Proxy webhook with raw body
---

Forward inbound webhooks **unchanged** to an upstream service.

---

### Forward

Use `request.forward` to forward the request as-is.

```ts
// routes/webhook.ts
import route from "primate/route";

export default route({
  post(request) {
    return request.forward("https://upstream.example.com/webhooks/provider"),
  },
});
```

---

### Gate by provider IP/secret before forwarding

Add a check before forwarding upstream.

```ts
// routes/webhook.ts
import route from "primate/route";

export default route({
  post(request) {
    if (request.headers.try("X-Secret") !== process.env.WEBHOOK_SECRET) {
      return new Response("unauthorized", { status: 401 });
    }
    return request.forward("https://upstream.example.com/webhooks/provider");
  },
});
```
