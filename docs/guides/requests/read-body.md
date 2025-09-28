---
name: Read body
---

Access the request body by calling methods on `request.body`. Methods validate
that the body is of the correct type.

---

### Text -> string

Use `text()` to get the body as a `string`.

```ts
// routes/api.ts
import route from "primate/route";

route.post(request => {
  const received = request.body.text();
  return { received };
});
```

---

### JSON -> Record

Use `json()` to get the body as JSON (`Record`).

```ts
// routes/api.ts
import route from "primate/route";

route.post(request => {
  const received = request.body.json();
  return { received };
});
```

---

### Form -> Record

Use `fields()` to get the body as form (`Record<string, string | File>`).

```ts
// routes/api.ts
import route from "primate/route";

route.post(request => {
  const received = request.body.fields();
  return { received };
});
```

---

### Binary -> Blob

Use `blods()` to get the body as binary (`Blob`).

```ts
// routes/api.ts
import route from "primate/route";

route.post(request => {
  const received = request.body.body();
  return { received };
});
```
