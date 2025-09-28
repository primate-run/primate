---
name: Forward requests
---

Proxy requests to upstream services using `request.forward()`.

!!!
Make sure you disable body parsing on the forwarded route, to keep Primate from
preparsing the body.
!!!

---

### Simple proxy

Forward request as-is.

[s=guides/requests/forward-requests/simple-proxy]

---

### Add headers

You can add headers to send along the forwarded request.

[s=guides/requests/forward-requests/add-headers]
