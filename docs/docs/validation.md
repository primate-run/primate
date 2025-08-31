# Validation

In Primate, validation refers to making sure that input passed into your routes
— typically from the frontend or API clients — is properly checked at runtime.
This ensures your backend logic never executes on malformed or malicious data.

Because the web is for the most part untyped, everything arrives as strings,
binary blobs, or loosely structured JSON. Primate uses its own validation
framework, [Pema](/pema), to define schemas for these inputs. These schemas are
applied in your routes to guarantee that inputs match the shapes your logic
expects.

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
| [Web forms](#web-forms)               | `request.body.fields` | `string\|File`   | form submission, Authentication     |
| [JSON API calls](#json-api-calls)     | `request.body.json`   | `JSONValue`      | REST APIs, client-side fetch calls  |
| [Binary uploads](#binary-uploads)     | `request.body.binary` | `Blob`           | File uploads                        |
| [Query parameters](#query-parameters) | `request.query`       | `string`         | Pagination, filtering               |
| [Path parameters](#path-parameters)   | `request.path`        | `string`         | REST resources, nested routes       |
| [Headers](#headers)                   | `request.headers`     | `string`         | Authentication, content negotiation |

## Web forms

Form submissions are received as `request.body.fields`, which optionally
accepts a schema. Values arrive as strings (or `File` for file inputs).

```ts
import pema from "pema";
import string from "pema/string";
import route from "primate/route";

const Login = pema({
  email: string.email(),
  password: string.min(8),
});

route.post(request => {
    const fields = request.body.fields(Login);
    // fields.email and fields.password are now validated
    return "Welcome back!";
  }
});
```

This ensures invalid email addresses or too-short passwords never reach your
logic.

!!!
`request.body.fields` isn't tied to Pema; it accepts any schema that exposes a
`parse` function; but only Pema integrates directly with Primate to throw a
`ParseError` that is intercepted and passed to the client.
!!!

## JSON API calls
When clients send JSON data (e.g. via `fetch`), you access it with
`request.body.json`.

```ts
import pema from "pema";
import string from "pema/string";
import uint from "pema/uint";
import route from "primate/route";

const CreateUser = pema({
  name: string,
  age: uint.min(13), // must be >= 13
});

route.post(request => {
    // short for CreateUser.parse(request.body.json())
    const user = request.body.json(CreateUser);
    // user is now guaranteed to match schema
    return { id: 42, ...user };
  }
});
```

## Binary uploads
Raw uploads (e.g. images) are available through `request.body.binary` as a
`Blob`.

```ts
import pema from "pema";
import string from "pema/string";
import uint from "pema/uint";
import blob from "pema/blob";
import route from "primate/route";

const Icon = blob.max(1000).type("image/png");

route.post(request => {
    // this throws if body isn't a binary stream or doesn't pass validation
    const file = Icon.parse(request.body.binary());

    await FileRef.write("/tmp/1.png", file);

    return "File uploaded!";
  }
});
```

Use this for scenarios where the payload itself is the file, not just a form
field.

## Query parameters
Query parameters (e.g. `?page=2&filter=active`) are strings accessible at
`request.query`.

```ts
import pema from "pema";
import uint from "pema/uint";
import string from "pema/string";
import route from "primate/route";

const Query = pema({
  page: uint.coerce.default(1),
  filter: string.optional(),
});

route.get(request => {
    const params = request.query.parse(Query);
    // params.page is a validated number
    return `Showing page ${params.page}`;
  }
});
```

## Path parameters
Path parameters are extracted from the route definition and exposed on
`request.path`.

```ts
import pema from "pema";
import uint from "pema/uint";
import route from "primate/route";

const Path = pema({
  userId: uint.coerce,
});

route.get(request => {
  const { userId } = request.path.parse(Path);
  return `Profile for user ${userId}`;
});
```

This is common in REST-style routes.

## Headers
Request headers are strings, available via `request.headers`.

```ts
import pema from "pema";
import string from "pema/string";
import route from "primate/route";

const Header = pema({
  authorization: string.startsWith("Bearer "),
});

route.get(request => {
  const { authorization } = request.headers.parse(Header);
  const bearer = authorization.slice("Bearer ".length);

  /* actually validate the token */

  return `Validated token: ${bearer}`;
});
```
