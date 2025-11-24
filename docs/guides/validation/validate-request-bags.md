---
title: Validate request bags
---

Validate different parts of the request (query, params, headers). Use pema
schemas.

!!!
Validate all input sources for security.
!!!

---

### Validate query params

Schema for query string.

```ts
// routes/search.ts
import route from "primate/route";
import pema from "pema";
import string from "pema/string";
import uint from "pema/uint";

const Query = pema({ q: string.min(1), limit: uint.max(100).default(10)});

route.get(request => {
  const { q, limit } = Query.parse(request.query);
  return { q, limit };
});
```

---

### Validate path params

Schema for path parameters.

```ts
// routes/user/[id].ts
import route from "primate/route";
import uint from "pema/uint";

route.get(request => {
  const id = uint.parse(request.path.get("id"));
  return { id };
});
```

---

### Validate headers

Schema for headers.

```ts
import route from "primate/route";
import string from "pema/string";

route.get(request => {
  const auth = string
    .startsWith("Bearer ")
    .parse(request.headers.get("Authorization"));
  return { auth };
});
```
