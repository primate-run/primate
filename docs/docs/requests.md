# Requests

Route functions accept a single parameter representing request data. This
aggregate object allows easy access to the parsed request `body`, any `path`
parameters defined with brackets, the `query` string split into parts,
`cookies` as well as other `headers` and a reference to the `original` WHATWG
`Request` object.

|property|type|description|
|-|-|-|
|[body](#body)|[RequestBody](#requestbody-reference)|request body|
|[path](#path)|[RequestBag](#requestbag-reference)|path parameters|
|[query](#query)|`RequestBag`|query string parameters|
|[headers](#headers)|`RequestBag`|request headers|
|[cookies](#cookies)|`RequestBag` (case-sensitive)|request cookies|
|[context](#context)|`Record<string, string>`|initial context for the client|
|[original](#original)|`Request`|original WHATWG request|
|[url](#url)|`URL`|original request URL|
|[pass](#pass)|`Function`|pass the request as-is to another address|

## Body

The parsed request body. Primate will decode the body according to the
`Content-Type` header sent with the request, and `request.body` offers different
methods to retrieve the body. `request.body` ensures you call the accessor that
matches the actual `Content-Type` (e.g., `json()` for `application/json`) and
throws otherwise.

[s=request/body]

If a client sends a POST request to `/identify` using the content type
`application/json` and `{"name": "John"}` as payload, this route will respond
with 200 saying `Hello, John`.

|Content type|Method|
|-|-|
|`text/plain`|`text()`|
|`application/json`|`json()`|
|`application/x-www-form-urlencoded`|`fields()`|
|`multipart/form-data`|`fields()`, object values can be `string` or `File`|
|`application/octet-stream`|`binary()`|

## `RequestBody` reference
[s=request/reference/RequestBody]

## Path
Path parameters extracted from bracketed segments in your route path (e.g.
`/users/[id]`, `/blog/[year]/[slug]`). Path params are exposed as a
[RequestBag](#requestbag-reference), so you can use `get`, `try`, `has`, and
`as` (schema-validated) accessors.

[s=request/path/get]

If a parameter is optional in your route, prefer `try()` and handle `undefined`.

[s=request/path/try]

!!!
We're using `[[slug]]` to denote an [optional](/routing#optional-routes) path
segment.
!!!

You can validate/coerce all params at once with a schema.

[s=request/path/schema]

## Query
The query string split into individual parameters, exposed as a `RequestBag`.
Use it to read `?page=2&search=john`-style parameters. Query string parameters
are matched in a case-insensitive manner. If a query parameter appears multiple
times, the last value wins.

```ts
// /search?page=2&search=john
route.get(request => {
  const page = Number(request.query.try("page") ?? "1"); // 1 if missing
  const term = request.query.get("search");
  return `Searching '${term}' (page ${page})`;
});
```

Schema-validate the entire query string:

```ts
import pema from "pema";
import int from "pema/int";
import string from "pema/string";

const Query = pema({
  page: int.min(1).default(1).coerce,
  search: string.min(1),
});

route.get(request => {
  const { page, search } = request.query.as(Query);
  return `Searching '${search}' (page ${page})`;
});
```

## Headers
Request headers as a `RequestBag`. Header keys are matched in a
case-insensitive manner. Duplicate header names are resolved with last-wins
semantics (matching is case-insensitive).

```ts
route.get(request => {
  const ua = request.headers.try("user-agent"); // may be undefined
  const contentType = request.headers.try("content-type");

  // returned as JSON
  return { ua, contentType };
});
```

Validate or transform headers with a schema:

```ts
import pema from "pema";
import string from "pema/string";

const HeaderSchema = pema({
  "content-type": string.optional(),
  authorization: string.startsWith("Bearer ").optional(),
});

route.get(request => {
  const headers = request.headers.as(HeaderSchema);

  return new Response(null, { status: headers.authorization ? 204 : 401 });
});
```

## Cookies

Request cookies as a `RequestBag`. Cookie names are matched, unlike all other
request bags, in a *case-sensitive* manner.

```ts
route.get(request => {
  const session = request.cookies.try("session"); // string | undefined
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  return new Response(`Hello (session ${session.slice(0, 8)}...)`);
});
```

As with other bags, you can parse/validate the whole set:

```ts
import pema from "pema";
import string from "pema/string";

const CookieSchema = pema({
  session: string.uuid().optional(),
});

route.get(request => {
  const { session } = request.cookies.as(CookieSchema);
  return new Response(session ? "OK" : "No session", { status: session ? 200 : 401 });
});
```

## `RequestBag` reference
[s=request/reference/RequestBag]

## Context
Initial context for the client. This is a plain dictionary available during
route execution and intended for values you want to expose to the client on
initial load.

```ts
import view from "primate/response/view";
// Add data to the initial client context:
route.get(request => {
  request.context.greeting = "Welcome!";
  request.context.env = "production";

  return view("hello.html");
});
```

Treat `context` as a lightweight key/value store for serializable data. Avoid
placing large or sensitive values in it.

## Original
The original WHATWG `Request` object as received from the runtime. Use this for
low-level capabilities like `clone()`, `signal`, or direct header access when
needed.

```ts
route.get(request => {
  // Abort handling if the client disconnects:
  request.original.signal.addEventListener("abort", () => {
    console.log("client disconnected");
  });

  // Access a raw header:
  const lang = request.original.headers.get("accept-language");
  return new Response(lang ?? "en-US");
});
```

## URL
A `URL` instance representing the request URL. Handy for composing absolute or
relative URLs, accessing the `searchParams` directly, etc.

```ts
route.get(request => {
  const url = request.url;
  const page = request.query.try("page") ?? "1";

  // Build a new URL relative to the request:
  const cdn = new URL("/assets/logo.svg", url);

  return { page, cdn: cdn.href};
});
```

## Pass
Forward the current request as-is to another address and return the upstream
response. If you proxy the raw request, disable body parsing; all other aspects
of the original request will be preserved.

```ts
// Proxy the current request to an upstream service:
route.all(request => {
  // absolute or relative target (implementation-dependent)
  return request.pass("https://upstream.internal/service");
}, { parseBody: false });
```

You can use this to implement simple reverse proxies, edge routing, or
fan-out/fan-in patterns.

!!!
When forwarding across origins, strip/override sensitive headers (e.g.,
Authorization, Cookie).
!!!

## `RequestFacade` reference
[s=request/reference/RequestFacade]
