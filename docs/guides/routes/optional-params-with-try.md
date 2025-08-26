---
name: Optional params with `.try()`
---

Use **double brackets** for optional segments and read them safely with `.try()` (or a schema default).

!!!
`.get(key)` throws when the parameter is absent; prefer `.try(key)` for optional segments.
!!!

---

### 1) Define the optional segment

```ts
// routes/user/[[name]].ts
import route from "primate/route";

route.get(req => {
  const name = req.path.try("name") ?? "guest";
  return `Hello, ${name}!`;
});
```

---

### 2) Support both `/user` and `/user/:name`

```ts
// Works for /user  -> "Hello, guest!"
// Works for /user/jane -> "Hello, jane!"
```
