---
title: Validate request body
---

Validate incoming request body with schemas. Use pema for type-safe validation.

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
  email: p.string.email() ,
});
```

---

### 2) Validate in route

Parse and validate body.

```ts
// routes/user.ts
import p from "pema";
import route from "primate/route";

const UserSchema = p({
  name: p.string.min(1),
  email: p.string.email(),
});

route.post(request => {
  const user = UserSchema.parse(request.body);
  return { user };
});
```

---

### 3) Handle validation errors

Catch and respond to errors.

```ts
import p from "pema";
import route from "primate/route";
import response from "primate/response";

const UserSchema = p({
  name: p.string.min(1),
  email: p.string.email(),
});

route.post(async (request) => {
  try {
    const user = UserSchema.parse(request.body);
    // save user
    return { success: true };
  } catch (error) {
    return response.json({ error: error.message }, { status: 400 });
  }
});
```
