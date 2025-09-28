---
name: Use query string
---

Access query parameters from the request object. Query params are URL-decoded.

!!!
Use `.get()` for required params, `.try()` for optional.
!!!

---

### Access query params

Read query via `request.query`.

[s=guides/requests/use-query-string/access-query-params]
