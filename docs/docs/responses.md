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

Primate attempts to read the source's name and MIME type if available. Use the
explicit `binary` handler for more options.

[s=responses/binary/explicit]

Use rcompat's `FileRef` to conveniently load a file from disk and stream it out.

[s=responses/binary/file-ref]

## Redirect
Return a `URL` to redirect to another address.

[s=responses/redirect/implicit]

Use the explicit `redirect` handler to vary the status or for local redirects.

[s=responses/redirect/explicit]

## View
Render and serve [components](/docs/components) from the `components` directory
as `text/html`.

[s=responses/view/simple]

### Props
Populate the component with initial props.

[s=responses/view/props]

### Page
Components are embedded into your app's main HTML page at `pages/app.html`,
with the component code replacing the `%body%` placeholder. If the app page
doesn't exist, Primate falls back to its standard one.

[s=responses/view/page]

Pass a different `page` option to use another HTML page.

[s=responses/view/other-page]

### Placeholders
You can use placeholders in your HTML pages.

[s=responses/view/placeholders/page]

Populate them in your routes.

[s=responses/view/placeholders/route]

### Partial
Pass a `partial: true` option to render the component without the enclosing
HTML page.

[s=responses/view/partial]

This is useful for replacing parts of the page whilst retaining the HTML page.

## Error
Serve a `404 Not Found` error page as `text/html`.
[s=responses/error/simple]

This handler uses the HTML file at `pages/error.html` or falls back to a
standard one provided by Primate.

[s=responses/error/page]

You can pass a custom status to this handler.

[s=responses/error/custom]

As with `view`, you can pass a different `page` option to use another HTML page.

[s=responses/error/other-page]

## WebSocket

Upgrade a `GET` request to `ws:` and handle `open`, `message`, and `close`
events.

[s=responses/ws]

## Server‑sent events

Push out events to the client as `text/event-stream`.

[s=responses/sse]

## Response

Return a custom `Response`.

[s=responses/Response]

## `ResponseLike` reference

[s=responses/reference/ResponseLike]
