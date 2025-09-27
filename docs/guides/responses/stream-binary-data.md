---
name: Stream binary data
---

Serve binary data like files or images. Use the `stream` response.

### Serve file

Read and return binary data.

```ts
// routes/file.ts
import route from "primate/route";
import response from "primate/response";
import FileRef from "@rcompat/fs/FileRef";

const file = new FileRef("path/to/file.pdf");

route.get(() => response.stream(file));
```

### Serve stream

Response back with the uploaded steam -- `Blob`s are automatically streamed.

```ts
// routes/backstream.ts
import route from "primate/route";

route.post(request => request.body.binary());
```
