---
name: Forward requests
---

Proxy requests to upstream services using `request.forward()`.

!!!
Make sure you disable body parsing on the forwarded route, to keep Primate from
preparsing the body.
!!!

### Simple proxy

Forward request as-is.

```ts
// routes/api.ts
import route from "primate/route";

route.get(request => request.forward("https://api.example.com"), {
  parseBody: false,
});
```

### Add headers

You can add headers to send along the forwarded request.

```ts
route.post(request =>
  request.forward("https://api.example.com", { "X-Custom": "value" }));
```
