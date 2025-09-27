---
name: Use path parameters
---

Access dynamic path parameters from the request object. Parameters are
URL-decoded.

!!!
Use `.get()` for required params, `.try()` for optional.
!!!

### 1) Define route with params

Use brackets in route filename.

```ts
// routes/user/[id].ts
import route from "primate/route";

route.get(request => {
  const id = request.path.get("id");
  return { id };
});
```

### 2) Access parameters

Read params via `request.path`.

```ts
route.get(request => {
  const id = request.path.get("id"); // throws if missing
  const name = request.path.try("name"); // null if missing
  return { id, name };
});
```

### 3) Multiple params

Stack brackets for nested params.

```ts
// routes/user/[id]/posts/[post_id].ts
route.get(request => {
  const id = request.path.get("id");
  const postId = request.path.get("post_id");
  return { id, postId };
});
```

### 4) Optional params

Use double brackets for optional.

```ts
// routes/user/[[name]].ts
route.get((request) => {
  const name = request.path.try("name") ?? "guest";
  return { name };
});
