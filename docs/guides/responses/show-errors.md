---
name: Show errors
---

Return error responses with appropriate status codes. Use `response()` for
custom errors.

!!!
Throw errors to trigger `+error.ts`; return responses for controlled errors.
!!!

### 1) Throw error

Triggers error handler.

```ts
// routes/api.ts
import route from "primate/route";

route.get(() => {
  throw new Error("Something went wrong");
});
```

### 2) Return error response

Controlled error response.

```ts
import response from "primate/response";

route.get(() => response.json({ error: "Bad request" }, { status: 400 }));
```

### 3) Error handler

Use `+error.ts` for global handling. Routes placed alongside `+error.ts` or in
subdirectories in its tree will trigger it upon throwing.

```ts
// routes/+error.ts
import route from "primate/route";

route.get(() => response.json({ error: "Internal error" }, { status: 500 }));
