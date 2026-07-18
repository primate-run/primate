---
title: Serving responses
---

# Responses
Route handlers return a `ResponseLike` value that Primate converts into a
WHATWG `Response`. You can return simple values ("implicit" responses) or use
explicit handlers from `primate/response` when you need to control all
aspects of the response.

|Return value|Handler|Response|Notes|
|-|-|-|-|
|`string`|[text](#text)|`200 text/plain`|Serve plain text|
|`object`|[json](#json)|`200 application/json`|Serve JSON|
|`Blob`·`File`·`FileRef`|[binary](#binary)|`200 application/octet-stream`|Stream contents|
|—|[redirect](#redirect)|`302`|Redirect safely|
|—|[view](#view)|`200 text/html`|Serve frontend component|
|—|[page](#page)|`200 text/html`|Serve collocated route page|
|—|[error](#error)|`404 text/html`|Show error page|
|—|[ws](#websocket)|`101`|WebSocket upgrade|
|—|[sse](#server-sent-events)|`200 text/event-stream`|Server‑sent events|
|`null`|—|`204`|`new Response(null)`|
|[Response](#response)|—|as given|WHATWG `Response`|

## Text
Return strings to serve `text/plain`.

[s=responses/text/implicit]

Use the explicit `text` handler for more options.

[s=responses/text/explicit]

## JSON
Return JSON-serializable objects to serve `application/json`.

[s=responses/json/implicit]

Use the explicit `json` handler for more options.

[s=responses/json/explicit]

## Binary

Return `Blob`, `File`, `ReadableStream` or any object exposing `{ stream():
ReadableStream }` to serve `application/octet-stream` (binary data).

[s=responses/binary/implicit]

Primate attempts to read the source's name and MIME type if available. Use the
explicit `binary` handler for more options.

[s=responses/binary/explicit]

Use rcompat's `FileRef` to conveniently load a file from disk and stream it out.

[s=responses/binary/file-ref]

## Redirect
Use `response.redirect.local` for origin-relative redirects. Local redirects are
safe by default: malformed paths, protocol-relative targets, backslashes,
control characters and targets that resolve to another origin are rejected.
The callable `response.redirect(...)` form remains an alias for
`response.redirect.local(...)`.

Pass an object to serialize query values with `URLSearchParams` rather than
building a nested query string manually. `false`, `0` and empty strings are
preserved; `null` and `undefined` are omitted; arrays produce repeated keys.
Explicit local fragments are preserved.

Use `response.redirect.external` only when an external destination is intended.
It requires an exact origin allowlist and accepts HTTPS destinations by default.
Origin checks do not use substring or suffix matching. HTTP requires the
explicit `allowHttp` development option, and URL credentials and non-HTTP
schemes are rejected.

Only `301`, `302`, `303`, `307` and `308` are accepted. Prefer `303 See Other`
after a form submission. `307` and `308` preserve the request method and body;
external redirects using either status also require `preserveMethod: true`.
Both local and external redirects enforce a 2048-byte `Location` limit by
default, configurable with `maxLocationBytes`.

Returning a `URL` no longer creates an implicit redirect. Migrate those routes
to `response.redirect.external` with an explicit `allowedOrigins` policy.
Never pass untrusted request or query input to an unrestricted external
redirect.

[s=responses/redirect/explicit]

## View
Render and serve [components](/docs/components) from the `views` directory as
`text/html`.

[s=responses/view/simple]

### Props
Populate the component with initial props.

[s=responses/view/props]

### Page
Components are embedded into your app's main HTML template at `templates/app.html`,
with the component code replacing the `%body%` placeholder. If the app template
doesn't exist, Primate falls back to its standard one.

[s=responses/view/template]

Pass a different `template` option to use another HTML template.

[s=responses/view/other-template]

### Placeholders
You can use placeholders in your HTML templates.

[s=responses/view/placeholders/template]

Populate them in your routes.

[s=responses/view/placeholders/route]

### Partial
Pass a `partial: true` option to render the component without the enclosing
HTML template.

[s=responses/view/partial]

This is useful for replacing parts of the page whilst retaining the HTML template.

## Page
Render a frontend component collocated with the current route using
`response.page`. This keeps the route handler and its page component next to each
other.

[s=responses/page/simple]

The matching component uses the same basename as the route and a frontend
extension.

[s=responses/page/component]

`response.page` accepts the same props and view options as `response.view`.

Layouts can use `response.page` too. A `+layout.ts` route looks for a collocated
`+layout` component, such as `+layout.tsx`, `+layout.svelte`, or
`+layout.vue`.

## Error
Serve a `404 Not Found` error page as `text/html`.
[s=responses/error/simple]

This handler uses the HTML file at `templates/error.html` or falls back to a
standard one provided by Primate.

[s=responses/error/template]

You can pass a custom status to this handler.

[s=responses/error/custom]

As with `view`, you can pass a different `template` option to use another HTML template.

[s=responses/error/other-template]

## WebSocket

Upgrade a `GET` request to `ws:` and handle `open`, `message`, and `close`
events.

[s=responses/ws]

## Server‑sent events

Push out events to the client as `text/event-stream`.

[s=responses/sse]

`response.sse` receives a setup function. Return a cleanup function to stop
timers, unsubscribe from event channels, or release any other resources when the
client disconnects.

```ts
return response.sse(source => {
  const timer = setInterval(() => {
    source.send("tick", Date.now());
  }, 1000);

  return () => clearInterval(timer);
});
```

For app-level pub/sub, use [`primate/events`](/docs/events) and return the
unsubscribe function from the SSE setup.

## Response

Return a custom `Response`.

[s=responses/Response]

## `ResponseLike` reference

[s=responses/reference/ResponseLike]
