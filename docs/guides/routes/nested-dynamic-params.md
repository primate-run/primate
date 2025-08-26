---
name: Nested dynamic params
---

Capture multiple path parameters by stacking bracketed segments and read them
via `request.path` (e.g., `routes/user/[id]/posts/[post].ts`).

!!!
Parameters are URL-decoded. For single-bracket segments like `[id]` or `[post]`,
the param is **guaranteed to exist if the route matched**, so `request.path.get("id")`
and `request.path.get("post")` are safe. Use `.try(key)` only with **optional**
segments like `[[name]]`.
!!!

---

### 1) Define nested params in the filesystem

Create a route with multiple bracketed segments and read each one from
`request.path.get(...)`.

[s=guides/routes/nested-dynamic-params/define]

---

### 2) Validate or coerce as needed

Coerce string params into the types you need and return a 4xx response when
validation fails (e.g., ensure `id` is a number).

[s=guides/routes/nested-dynamic-params/validate]
