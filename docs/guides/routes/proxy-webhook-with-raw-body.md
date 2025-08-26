---
name: Proxy webhook with raw body (no parsing)
---

Forward inbound webhooks **unchanged** to an upstream service by disabling body parsing
and using `request.pass`.

!!!
With `{ parseBody: false }`, `request.body` is `null` and the original stream is forwarded as-is.
This is critical for signature verification.
!!!

---

### 1) Disable parsing and forward

```ts
// routes/webhook.ts
import route from "primate/route";

route.post(
  req => req.pass("https://upstream.example.com/webhooks/provider"),
  { parseBody: false },
);
```

---

### 2) (Optional) Gate by provider IP/secret before forwarding

```ts
// routes/webhook.ts
import route from "primate/route";

route.post(
  req => {
    if (req.headers.get("X-Secret") !== process.env.WEBHOOK_SECRET) {
      return new Response("unauthorized", { status: 401 });
    }
    return req.pass("https://upstream.example.com/webhooks/provider");
  },
  { parseBody: false },
);
```
