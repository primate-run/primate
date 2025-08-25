---
name: Stream events with SSE
---

Use **Server-Sent Events (SSE)** to push updates to the browser over a
long-lived HTTP response (`text/event-stream`). The `sse` helper handles headers
and the connection lifecycle.

!!!
This assumes you have [installed and loaded](/guides/load-modules)
`@primate/html` in your config file.
!!!

---

### 1) Client — subscribe to events

Create an HTML component that subscribes to SSE via `EventSource`.

[s=guides/responses/stream-events-with-sse/component]

---

### 2) Serve a page (route choice is flexible)

You can serve this page from **any** route. We'll use `/` for brevity.

[s=guides/responses/stream-events-with-sse/index]

---

### 3) Server — SSE endpoint

Expose `/sse` and periodically send events.

[s=guides/responses/stream-events-with-sse/sse]
