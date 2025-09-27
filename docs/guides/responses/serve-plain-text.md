---
name: Serve plain text
---

Return strings to serve plain text responses. Primate sets
`Content-Type: text/plain` on returned string.

!!!
Strings are served as text; use `response.text()` for granular control.
!!!

### Return string

Primate sets `Content-Type: text/plain` on returned string.

```ts
// routes/hello.ts
import route from "primate/route";

route.get(() => "Hello, World!");
```

### Explicit text response

Use `response.text()` for custom options.

```ts
import response from "primate/response";
import route from "primate/route";

route.get(() => response.text("Not found", { status: 404 }));
```

### Custom content type

Specify MIME type.

```ts
import response from "primate/response";
import route from "primate/route";

route.get(() => response("Custom text", {
    headers: { "Content-Type": "text/custom" }
}));
