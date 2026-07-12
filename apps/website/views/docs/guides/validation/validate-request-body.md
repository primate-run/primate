---
title: Validate request body
---

Validate incoming request body with schemas. Use Pema for type-safe validation.

!!!
Validation throws on failure; handle errors appropriately.
!!!

---

### 1) Define schema

Create validation schema.

```ts
// routes/user.ts
import p from "pema";

const UserSchema = p({
  name: p.string.min(1),
  email: p.string.email(),
});
```

---

### 2) Validate in route

Attach the schema to the route. Primate validates the body before returning it
from `request.body.form()`.

```ts
// routes/user.ts
import p from "pema";
import route from "primate/route";

const UserSchema = p({
  name: p.string.min(1),
  email: p.string.email(),
});

export default route({
  post: route.with(
    {
      body: UserSchema,
      contentType: "application/x-www-form-urlencoded",
    },
    async request => {
      const user = await request.body.form();
      return { user };
    },
  ),
});
```

For JSON, pair the schema with `application/json` and read with
`request.body.json()`.

```ts
// routes/user.ts
import p from "pema";
import route from "primate/route";

const UserSchema = p({
  name: p.string.min(1),
  email: p.string.email(),
});

export default route({
  post: route.with(
    {
      body: UserSchema,
      contentType: "application/json",
    },
    async request => {
      const user = await request.body.json();
      return { user };
    },
  ),
});
```

---

### 3) Derive a body value

Use `.derive(...)` to validate an object and return a normalized value to the
handler.

```ts
// routes/user.ts
import p from "pema";
import route from "primate/route";

const UserName = p({
  name: p.string.min(1),
}).derive(({ name }) => name.trim().toUpperCase());

export default route({
  post: route.with(
    {
      body: UserName,
      contentType: "application/json",
    },
    async request => {
      const name = await request.body.json();
      return { name };
    },
  ),
});
```

---

### 4) Use an async body schema

Use `p.async(...)` when normalization needs to await work before the handler
receives the body.

```ts
// routes/user.ts
import p from "pema";
import route from "primate/route";

const User = p.async({
  email: p.string.email(),
}).derive(async ({ email }) => {
  return await findOrCreateUser(email);
});

export default route({
  post: route.with(
    {
      body: User,
      contentType: "application/json",
    },
    async request => {
      const user = await request.body.json();
      return { user };
    },
  ),
});
```

---

### 5) Handle validation errors

Catch and respond to errors when you need custom output. If you don't catch the
error, Primate returns a `400 Bad Request` validation response.

```ts
import p from "pema";
import route from "primate/route";
import response from "primate/response";

const UserSchema = p({
  name: p.string.min(1),
  email: p.string.email(),
});

export default route({
  post: route.with(
    {
      body: UserSchema,
      contentType: "application/json",
    },
    async request => {
      try {
        const user = await request.body.json();
        // save user
        return { success: true, user };
      } catch (error) {
        return response.json({ error: error.message }, { status: 400 });
      }
    },
  ),
});
```
