---
title: Handling requests
---

# Requests

Route handlers receive a single `RequestFacade` object that bundles everything
you need to handle an incoming HTTP request: the parsed `body`, `path`
parameters, `query` parameters, `cookies`, `headers`, the original WHATWG
`Request`, and a `URL` helper. This page walks through each part and shows how
to access and validate it.

|Property|Type|Description|
|-|-|-|
|[body](#body)|[RequestBody](#requestbody-reference)|parsed request body|
|[path](#path)|[RequestBag](#requestbag-reference)|path parameters|
|[query](#query)|[RequestBag](#requestbag-reference)|query parameters|
|[headers](#headers)|[RequestBag](#requestbag-reference)|request headers|
|[cookies](#cookies)|[RequestBag](#requestbag-reference)|request cookies (case-sensitive)|
|[original](#original)|`Request`|original WHATWG `Request` object|
|[url](#url)|`URL`|original request URL|
|[forward](#forward)|`(to: string) => Promise<Response>`|forward the request|

!!!
`RequestFacade` also supports a request context store for sharing derived
values between hooks and route handlers (see
[Request context](#request-context)).

## Body

The parsed request body. Primate decodes the body according to the
`Content-Type` header sent with the request, and `request.body` offers different
methods to retrieve the body. `request.body` enforces the correct accessor for
the incoming `Content-Type` (e.g., `json()` for `application/json`) and throws
on a mismatch.

[s=request/body]

If a client sends a `POST` request to `/identify` using the content type
`application/json` and `{"name": "John"}` as payload, this route responds with
`200 OK` and the body `Hello, John`.

|Content type|Method|
|-|-|
|`text/plain`|`text()`|
|`application/json`|`json()`|
|`application/x-www-form-urlencoded`|`form()`|
|`multipart/form-data`|`form()` — values are `FormDataEntryValue` (`string` or `File`)|
|`application/octet-stream`|`binary()`|
|no body|`none()`|

## `RequestBody` reference
[s=request/reference/RequestBody]

## Path
Path parameters extracted from bracketed segments in your route path (e.g.
`routes/users/[id]`, `routes/blog/[year]/[slug]`).
Path parameters are exposed
as a [RequestBag](#requestbag-reference), with `get()`, `try()`, `has()`, and
schema-validated `as()`.


[s=request/path/get]

If a parameter is optional in your route, prefer `try()` and handle `undefined`.

[s=request/path/try]

!!!
We're using `[[slug]]` to denote an [optional](/docs/routing#optional-routes)
path segment.
!!!

You can validate/coerce all parameters at once with a schema.

[s=request/path/schema]

## Query
The query string is split into individual parameters and exposed as a
`RequestBag`. Use it to read `?page=2&search=john`-style parameters. Query
string parameters are matched case-insensitively. If a query parameter appears
multiple times, Primate keeps only the last.

[s=request/query/get]

Schema-validate the entire query string:

[s=request/query/schema]

!!!
`request.query` normalizes keys, `request.url.searchParams` does not.
!!!

## Headers
Request headers as a `RequestBag`. Header keys are matched case-insensitively.
If a header appears multiple times, the last value is kept.

[s=request/headers/get]

Validate or transform headers with a schema.

[s=request/headers/schema]

## Cookies
Request cookies as a `RequestBag`. Cookie names are *case-sensitive* (unlike
other request bags). If a cookie repeats, Primate keeps the last value.

[s=request/cookies/get]

As with other bags, you can parse/validate the whole set.

[s=request/cookies/schema]

## `RequestBag` reference
[s=request/reference/RequestBag]

## Original
The original WHATWG `Request` object as received from the runtime. Use this for
low-level capabilities like `clone()`, `signal`, or direct header access when
needed.

[s=request/original]

## URL
A `URL` instance representing the request URL. Handy for composing absolute or
relative URLs, accessing the `searchParams` directly, etc.

[s=request/URL]

## Forward
Forwards the **original WHATWG** `Request`. The method lives on `RequestFacade`,
but what's forwarded is the underlying original request.

If your handler will pass the request upstream and you don't need to read the
body, disable body parsing on the route. Primate can't know whether you'll call
`request.forward()` inside the handler, so you must explicitly **opt out** of
body parsing on the route.

Most other aspects of the original request are preserved. By default only the
`Content-Type` header is forwarded to match the body — you can specify
additional headers to forward.

[s=request/forward]

Use this to implement simple reverse proxies, edge routing, or fan-out/fan-in
patterns.


## Request context

`RequestFacade` includes a **request context** store: request-scoped values that
hooks can attach for downstream hooks and route handlers to read.

Use request context for **derived server values** (e.g. authenticated user,
locale, feature flags, request IDs). For client input, use `body`, `path`,
`query`, `headers`, or `cookies`.

Context is most commonly set in [hooks](/docs/routing#hooks).

### API

|Method|Description|
|--------|-------------|
|`request.set(key, value)`| Set a context value |
|`request.set<T>(key, fn)`| Update a context value with a function |
|`request.get<T>(key)`| Get a context value (throws if missing) |
|`request.try<T>(key)`| Get a context value or `undefined` |
|`request.has(key)` | Check if a context key exists |
|`request.delete(key)`| Remove a context key |

!!!
Context is **not** part of the underlying WHATWG `Request`. `request.forward()`
forwards the original request, not your attached context.
!!!

You can use hooks to authenticate in a hook, and then use in a route.

```ts
// routes/+hook.ts
import hook from "primate/route/hook";

hook(async (request, next) => {
  const user = await authenticate(request);
  return next(request.set("auth.user", user));
});
```

## `RequestFacade` reference
[s=request/reference/RequestFacade]
