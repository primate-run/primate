---
title: Input validation
---

# Validation

In Primate, validation refers to making sure that input passed into your routes
— typically from the frontend or API clients — is properly checked at runtime.
This ensures your backend logic never executes on malformed or malicious data.

Because the web is for the most part untyped, everything arrives as strings,
binary blobs, or loosely structured JSON. Primate uses its own validation
framework, Pema, to define schemas for these inputs. These schemas are applied
in your routes to guarantee that inputs match the shapes your logic expects.

!!!
TypeScript already provides compile-time validation during development, but
only Pema can enforce correctness at runtime, when real clients interact with
your app.
!!!

Validation errors are surfaced as `ParseError`. Unlike regular errors,
Primate automatically serializes them into a `400 Bad Request` JSON response
and returns them to the client:

```json
{
  "/email": {
    "message": "Expected valid email",
    "messages": ["Expected valid email"]
  }
}
```

You can override this by catching the error yourself and returning a custom
response.

## Summary

| Input type                            | In Primate            | Types            | Use cases                           |
| ------------------------------------- | --------------------- | ---------------- | ------------------------------------|
| [Web forms](#web-forms)               | `request.body.form`   | `string\|File`   | form submission, Authentication     |
| [JSON API calls](#json-api-calls)     | `request.body.json`   | `JSONValue`      | REST APIs, client-side fetch calls  |
| [Binary uploads](#binary-uploads)     | `request.body.blob`   | `Blob`           | File uploads                        |
| [Query parameters](#query-parameters) | `request.query`       | `string`         | Pagination, filtering               |
| [Path parameters](#path-parameters)   | `request.path`        | `string`         | REST resources, nested routes       |
| [Headers](#headers)                   | `request.headers`     | `string`         | Authentication, content negotiation |

## Web forms

Form submissions are received as `request.body.form`, which optionally
accepts a schema. Values arrive as strings (or `File` for file inputs).

```ts
import p from "pema";
import route from "primate/route";

const Login = p({
  email: p.string.email(),
  password: p.string.min(8),
});

export default route({
  async post(request) {
      const form = Login.parse(await request.body.form());
      // form.email and form.password are now validated
      return "Welcome back!";
  },
});
```

This ensures invalid email addresses or too-short passwords never reach your
logic.

!!!
`request.body.form` isn't tied to Pema; it accepts any schema that exposes a
`parse` function; but only Pema integrates directly with Primate to throw a
`ParseError` that is intercepted and passed to the client.
!!!

## JSON API calls
When clients send JSON data (e.g. via `fetch`), you access it with
`request.body.json`.

```ts
import p from "pema";
import route from "primate/route";

const CreateUser = p({
  name: p.string,
  age: p.uint.min(13), // must be >= 13
});

export default route({
  async post(request) {
    const user = CreateUser.parse(await request.body.json());
    // user is now guaranteed to match schema
    return { id: 42, ...user };
  },
});
```

You can also attach a body schema directly to the route. Primate validates the
body before returning it from `request.body.json()`.

```ts
import p from "pema";
import route from "primate/route";

const CreateUser = p({
  name: p.string,
  age: p.uint.min(13),
});

export default route({
  post: route.with(
    { body: CreateUser, contentType: "application/json" },
    async request => {
      const user = await request.body.json();
      return { id: 42, ...user };
    },
  ),
});
```

## Derived values

Use `.derive(...)` to transform a parsed value while keeping validation and
normalization in one schema.

```ts
import p from "pema";

const Name = p({
  first: p.string,
  last: p.string,
}).derive(({ first, last }) => `${first} ${last}`);

const name = Name.parse({ first: "John", last: "Adams" });
// name is "John Adams"
```

Derived schemas work with route body schemas too.

```ts
import p from "pema";
import route from "primate/route";

const Body = p({
  name: p.string,
}).derive(({ name }) => name.toUpperCase());

export default route({
  post: route.with(
    { body: Body, contentType: "application/json" },
    async request => {
      const name = await request.body.json();
      return name;
    },
  ),
});
```

## Async object schemas

Use `p.async(...)` when an object schema needs async normalization. The schema
parses the object first, then awaits any derived value.

```ts
import p from "pema";

const User = p.async({
  id: p.string,
}).derive(async ({ id }) => {
  return await loadUser(id);
});

const user = await User.parse({ id: "john" });
```

Async schemas can validate request bodies.

```ts
import p from "pema";
import route from "primate/route";

const Body = p.async({
  name: p.string,
}).derive(async ({ name }) => name.toUpperCase());

export default route({
  post: route.with(
    { body: Body, contentType: "application/json" },
    async request => {
      const name = await request.body.json();
      return name;
    },
  ),
});
```

They can also validate path parameters while preserving the object properties
Primate needs to match schema keys to route segments.

```ts
// routes/user/[id].ts
import p from "pema";
import route from "primate/route";

const Path = p.async({
  id: p.string,
}).derive(async ({ id }) => ({
  id: await resolveUserId(id),
}));

export default route({
  get: route.with({ path: Path }, request => {
    return request.path.get("id");
  }),
});
```

## Binary uploads
Raw uploads (e.g. images) are available through `request.body.blob` as a `Blob`.

```ts
import p from "pema";
import route from "primate/route";

const Icon = p.blob.max(1000).type("image/png");

export default route({
  async post(request) {
      // this throws if body isn't a binary stream or doesn't pass validation
      const file = Icon.parse(await request.body.blob());

      await FileRef.write("/tmp/1.png", file);

      return "File uploaded!";
  },
});
```

Use this for scenarios where the payload itself is the file, not just a form
field.

## Query parameters
Query parameters (e.g. `?page=2&filter=active`) are strings accessible at
`request.query`.

```ts
import p from "pema";
import route from "primate/route";

const Query = p({
  page: p.loose.uint.default(1),
  filter: p.string.optional(),
});

export default route({
  get(request) {
      const params = Query.parse(request.query);
      // params.page is a validated number
      return `Showing page ${params.page}`;
  },
});
```

## Path parameters
Path parameters are extracted from the route definition and exposed on
`request.path`.

```ts
import p from "pema";
import route from "primate/route";

const Path = p({
  userId: p.loose.uint,
});

export default route({
  get(request) {
      const { userId } = Path.parse(request.path);
      return `Profile for user ${userId}`;
  },
});
```

This is common in REST-style routes.

## Headers
Request headers are strings, available via `request.headers`.

```ts
import p from "pema";
import route from "primate/route";

const HeadersSchema = p({
  authorization: p.string.startsWith("Bearer "),
});

export default route({
  get(request) {
      const { authorization } = HeadersSchema.parse(request.headers);
      const bearer = authorization.slice("Bearer ".length);

      /* actually validate the token */

      return `Validated token: ${bearer}`;
  },
});
```
