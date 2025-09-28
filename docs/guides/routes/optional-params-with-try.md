---
name: Optional params with `.try()`
---

Use **double brackets** for optional segments and read them safely with `.try()` (or a schema default).

!!!
`.get(key)` throws when the parameter is absent; prefer `.try(key)` for optional segments.
!!!

---

### 1) Define the optional segment

Create a route file with an optional param.

```sh
touch routes/user/[[name]].ts
```

---

### 2) Support both `/user` and `/user/:name`

Use `try` with a fallback in case the param is `undefined`.

```ts
// routes/user/[[name]].ts
import route from "primate/route";

route.get(request => {
  const name = request.path.try("name") ?? "guest";
  return `Hello, ${name}!`;
});
```
