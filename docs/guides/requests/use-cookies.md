---
name: Use cookies
---

Access cookies from the request object. Cookies are parsed from the `Cookie`
header.

---

### Read cookies

Access cookies via `request.cookies`.

```ts
// routes/index.ts
import route from "primate/route";

route.get(request => {
  const sessionId = request.cookies.get("session_id");
  return { sessionId };
});
```

---

### Set cookies

Use the `Set-Cookie` header to set cookies in responses.

```ts
import route from "primate/route";

route.get(() => {
  return new Response("Cookie set", {
    headers: {
      "Set-Cookie": "session_id=abc123; HttpOnly"
    }
  });
});
```
