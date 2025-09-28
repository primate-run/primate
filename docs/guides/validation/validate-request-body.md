---
name: Validate request body
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
import pema from "pema";
import string from "pema/string";
import email from "pema/email";

const UserSchema = pema({ name: string.min(1), email: string.email() });
```

---

### 2) Validate in route

Parse and validate body.

```ts
// routes/user.ts
import route from "primate/route";

const UserSchema = pema({ name: string.min(1), email: string.email() });

route.post(request => {
  const user = UserSchema.parse(request.body);
  return { user };
});
```

---

### 3) Handle validation errors

Catch and respond to errors.

```ts
import route from "primate/route";
import response from "primate/response";

const UserSchema = pema({ name: string.min(1), email: string.email() });

route.post(async (request) => {
  try {
    const user = UserSchema.parse(request.body);
    // save user
    return { success: true };
  } catch (error) {
    return response.json({ error: error.message }, { status: 400 });
  }
});
