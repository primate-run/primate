# Responses
Route handlers return a `ResponseLike` value that Primate converts into a
WHATWG `Response`. You can return simple values ("implicit" responses) or use
explicit handlers from `primate/response/*` when you need to control all
aspects of the response.

## Summary

|Return value|Handler|Response|Notes|
|-|-|-|-|
|`string`|[text](#text)|`200 text/plain`|Serve plain text|
|`object`|[json](#text)|`200 application/json`|Serve JSON|
|`Blob`·`File`·`FileRef`|[binary](#binary)|`200 application/octet-stream`|Stream contents|
|`URL`|[redirect](#redirect)|`302`|Redirect to URL|
|—|[view](#view)|`200 text/html`|Serve frontend component|
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

Primate will attempt to read the source's name and MIME type if available.
Use the explicit `binary` handler for more options.

[s=responses/binary/explicit]

Use rcompat's `FileRef` to conveniently load a file from disk and stream it out.

[s=responses/binary/file-ref]

## Redirect
Return a `URL` to redirect to another address.

[s=responses/redirect/implicit]

Use the explicit `redirect` handler to vary the status or for local redirects.

[s=responses/redirect/explicit]

## View
Use the `view` handler to render and serve a [component](/components) from
the `components` directory as `text/html`.

[s=responses/view/simple]

### Props
Populate the component with initial props.

[s=responses/view/props]

### Page

Components are embedded into your app's main HTML page at `pages/app.html`,
with the component code replacing the `%body%` placeholder. If the app page
doesn't exist, Primate will fall back to its standard one.

[s=responses/view/page]

Pass a different `page` under options to use another HTML page.

[s=responses/view/other-page]

### Placeholders

You can use placeholders in your HTML pages.

[s=responses/view/placeholders/page]

Populate them from your routes.

[s=responses/view/placeholders/route]

!!! info
Consider writing a [Module](/module) to set certain placeholders for every
route.
!!!

### Partial
Pass `partial: true` as options to render the component without the enclosing
HTML page.

[s=responses/view/partial]

This is useful for replacing parts of the page while reusing the HTML page.

## Error

Render an error page. Defaults to **404 Not Found**.

```ts
import error from "primate/response/error";

export default () => error("Not Found");
```

Set a custom status (e.g., **500**):

```ts
import error from "primate/response/error";
import { Status } from "@rcompat/http/Status";

export default () => error("Boom", { status: Status.INTERNAL_SERVER_ERROR });
```

## WebSocket

Upgrade the request to `ws:` and handle `open`, `message`, and `close`.

```ts
import ws from "primate/response/ws";

export default () => ws({
  open(socket) {
    socket.send("hello");
  },
  message(socket, message) {
    // echo
    socket.send(String(message));
  },
  close() {
    // cleanup
  },
});
```

## Server‑sent events

Return `text/event-stream` and push events.

```ts
import sse from "primate/response/sse";

export default () => sse(({ send }) => {
  const timer = setInterval(() => send("tick", Date.now()), 1000);
  return () => clearInterval(timer); // cleanup on disconnect
});
```

## `Response`

Return any WHATWG `Response` yourself.

```ts
import { Status } from "@rcompat/http/Status";

export default () => new Response("custom", {
  status: Status.ACCEPTED,
  headers: { "X-Custom": "1" },
});
```

## `ResponseLike` reference

`ResponseLike` is what route handlers may return. In essence:

```ts
type ResponseLike =
  | Response                      // a WHATWG Response you construct
  | import("primate/response/ResponseFunction").default // function receiving `app`
  | string                        // → text/plain
  | URL                           // → redirect
  | Blob | ReadableStream         // → application/octet-stream
  | Record<string, unknown>       // → application/json
  | Array<Record<string, unknown>>// → application/json
  | null                          // → 204 No Content
  | Promise<ResponseLike>;        // anything above, asynchronously
```

Auto‑detection lives in `src/private/response/respond.ts` and applies the same mapping used by the explicit helpers.
