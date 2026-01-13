---
title: Handle validation errors
---

Use **Pema** schemas to validate inputs. When validation fails, Pema throws a
`ParseError`. By default, Primate automatically turns this into a structured
`400 Bad Request` JSON response.

---

### Default behavior

If you don't catch the error, Primate responds with a specific JSON format
describing what failed.

!!!
This is the kind of behavior you want in most cases, as Primate's frontends
have [validation](/docs/frontend#validate) and [form](/docs/frontend#form)
helpers to keep client values validated and synced with the server.
!!!

```ts
import p from "pema";
import route from "primate/route";

const Signup = p({
  email: p.string.email(),
});

route.post(request => {
  // throws a `ParseError` if the `email` field does not contain a valid email
  const { email } = request.body.form(Signup);
  return `Signed up with ${email}`;
});
```

---

### Custom JSON error

If you want custom behavior, wrap your validation in a `try/catch` block to
override the default and return a custom response instead.

```ts
import ParseError from "pema/ParseError";

route.post(request => {
  try {
    const { email } = request.body.form(Signup);
    return `Signed up with ${email}`;
  } catch (error) {
    if (error instanceof ParseError) {
      // returned as JSON
      return { error: "Please provide a valid email address." };
    }
    // will show an error page
    throw error;
  }
});
```

---

### Custom error page

For frontend routes, you might prefer rendering a page rather than JSON.

!!!
`primate/response` bundles all standard response handlers such as `json`,
`text`, and `error`.
!!!

```ts
import ParseError from "pema/ParseError";
import response from "primate/response";

route.post(request => {
  try {
    const { email } = request.body.form(Signup);
    return `Signed up with ${email}`;
  } catch (error) {
    if (error instanceof ParseError) {
      return response.error("error.jsx", { message: "Invalid signup details" });
    }
    throw error;
  }
});
```
