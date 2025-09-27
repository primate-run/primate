---
name: Add a Go backend
---

Add Go routes with the `@primate/go` module. Write handlers in Go; Primate
compiles them to WebAssembly and wires them like JS routes.

!!!
Make sure the Go executable is available in your `PATH`. Primate needs it to
compile your routes to WebAssembly.
!!!

### 1) Install

Install the Primate Go package.

```sh
npm i @primate/go
```

### 2) Configure

Load the Go module in your configuration.

```ts
import config from "primate/config";
import go from "@primate/go";
export default config({ modules: [go()] });
```

### 3) Write a route

Compose a route in Go.

```go
// routes/index.go
package main

import (
	"github.com/primate-run/go/core"
	"github.com/primate-run/go/route"
)

var _ = route.Get(func(_ route.Request) any { return "Hello from Go" })
var _ = route.Post(func(_ route.Request) any { return core.Dict{"ok": true} })
```
