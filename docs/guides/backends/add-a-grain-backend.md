---
name: Add a Grain backend
---

Add Grain routes with the `@primate/grain` module. Write handlers in Grain;
Primate compiles them to WebAssembly and wires them like JS routes.

!!!
Make sure the Grain executable is available in your `PATH`. Primate needs it to
compile your routes to WebAssembly.
!!!

### 1) Install

Install the Primate Grain package.

```sh
npm i @primate/grain
```

### 2) Configure

Load the Grain module in your configuration.

```ts
import config from "primate/config";
import grain from "@primate/grain";
export default config({ modules: [grain()] });
```

### 3) Write a route

Compose a route in Grain.

```gr
module Object

from "primate/request" include Request
from "primate/response" include Response
from "json" include Json
use Response.{ type Response }
use Request.{ type Request }

provide let get = (request: Request) => {
  "Hello from Grain"
}
provide let post = (request: Request) => {
  Response.json(JsonObject([("ok", JsonBoolean(true))]))
}
```
