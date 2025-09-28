---
name: Use path parameters
---

Access dynamic path parameters from the request object. Parameters are
URL-decoded.

!!!
Use `.get()` for required params, `.try()` for optional.
!!!

---

### Define route with params

Use brackets in route filename.

[s=guides/requests/use-path-parameters/define-route-with-params]

---

### Access parameters

Read params via `request.path`.

[s=guides/requests/use-path-parameters/access-parameters]

---

### Multiple params

Stack brackets for nested params.

[s=guides/requests/use-path-parameters/multiple-params]

---

### Optional params

Use double brackets for optional.

[s=guides/requests/use-path-parameters/optional-params]
