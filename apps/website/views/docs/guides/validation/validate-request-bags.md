---
title: Validate request bags
---

Validate different parts of the request (query, params, headers). Use Pema
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
import p from "pema";

const Query = p.loose({
  q: p.string.min(1),
  limit: p.uint.max(100).default(10),
});

export default route({
  get(request) {
    const { q, limit } = Query.parse(request.query);
    return { q, limit };
  },
});
```

---

### Validate path params

Schema for path parameters.

```ts
// routes/user/[id].ts
import route from "primate/route";
import p from "pema";

export default route({
  get(request) {
    const id = p.loose.uint.parse(request.path.get("id"));
    return { id };
  },
});
```

---

### Validate headers

Schema for headers.

```ts
import route from "primate/route";
import p from "pema";

const IsBearer = p({
  Authorization: p.string.startsWith("Bearer "),
});

export default route({
  get(request) {
    const { Authorization } = IsBearer.parse(request.headers);

    return { auth: Authorization };
  },
});
```
