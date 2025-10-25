# Backends

Primate supports multiple backend languages compiled to WebAssembly. Use one
or mix them in the same app for different routes.

## Overview

| Backend | Routes | Body | Query | Sessions | Stores | WebSocket | Validation |
| ------- | ------ | ---- | ----- | -------- | ------ | --------- | ---------- |
| [Go]    | ✓      | ✓    | ✓     | ✓        |        |           | ✓          |
| [Grain] | ✓      | ✓    | ✓     | ✓        | ✓      | ✓         |            |
| [Python]| ✓      | ✓    | ✓     | ✓        |        |           | ✓          |
| [Ruby]  | ✓      | ✓    | ✓     | ✓        |        |           | ✓          |

[Go]: /docs/backend/go
[Grain]: /docs/backend/grain
[Python]: /docs/backend/python
[Ruby]: /docs/backend/ruby

## Features

* **Routes** — HTTP method handlers (GET, POST, PUT, DELETE, etc.)
* **Body** — handle JSON, form data, text, binary, and file uploads
* **Query** — access URL query parameters and path variables
* **Sessions** — server-side session management with cookies
* **Stores** — built-in database operations (CRUD, queries, validation)
* **WebSocket** — real-time bidirectional communication
* **Validation** — strongly-typed request/response validation schemas

## WebAssembly

Backends run in the JS runtime via WebAssembly or a Wasm-based runtime (e.g.
Pyodide for Python).

## Language Categories

### Pre-Compiled Languages

*Go*, *Grain*

Compiled languages with strong type systems, memory safety, and excellent
WebAssembly support. Well-suited for high-performance APIs and complex
business logic.

### Dynamic Languages

*Python*, *Ruby*

Interpreted languages with flexible syntax and extensive ecosystems. Good
for rapid prototyping, data processing, and scripting tasks.

## Quickstart

Install a backend module:

```bash
npm install @primate/go
```

Configure it:

```ts
// config/app.ts
import config from "primate/config";
import go from "@primate/go";

export default config({
  modules: [go()],
});
```

Create a route handler:

```go
// routes/hello.go
package main

import "github.com/primate-run/go/route"

var _ = route.Get(func(request route.Request) any {
    return "Hello, World!"
})
```

## Route Structure

Each backend follows a consistent pattern for route handlers:

### HTTP Methods

All backends support standard HTTP methods through dedicated functions:

```go
// Go
var _ = route.Get(func(request route.Request) any { ... })
var _ = route.Post(func(request route.Request) any { ... })
```

```gr
// Grain
provide let get = (request: Request) => { ... }
provide let post = (request: Request) => { ... }
```

```python
# Python
@Route.get
def get(request): ...

@Route.post
def post(request): ...
```

```ruby
# Ruby
Route.get do |request|
  ...
end

Route.post do |request|
  ...
end
```

### Request Handling

Access request data through consistent APIs:

```go
// Go - Query parameters
if request.Query.Has("name") {
    name, _ := request.Query.Get("name")
    return name
}

// Go - JSON body
json, err := request.Body.JSON()
```

```gr
// Grain - Query parameters
let query = Request.getQuery(request)
match (Map.get("name", query)) {
  Some(value) => JsonString(value),
  None => JsonString("name missing")
}

// Grain - JSON body
Body.json(request)
```

## Response Types

### Data Responses

Return structured data as JSON:

```go
return map[string]any{"message": "Hello"}
```

```gr
JsonObject([("message", JsonString("Hello"))])
```

### Views

Render frontend components:

```go
return response.View("component.html", data)
```

```gr
Response.view("component.html", props = data)
```

### Redirects

Redirect to other routes:

```go
return response.Redirect("/other-route")
```

```gr
Response.redirect("/other-route")
```

## Database Operations

Built-in store operations:

```gr
// Grain
let User = Store.store("User")
let user = Store.insert(User, userData)
```

## Session Management

Server-side sessions with automatic cookie handling:

```go
// Go
session.Create(map[string]any{"user": "john"})
data := session.Get()
```

```gr
// Grain
Session.create(JsonObject([("user", JsonString("john"))]))
let session = Session.get()
```

## WebSocket Support

Real-time communication endpoints:

```gr
// Grain
Response.ws(
  message = Some((socket, payload) => {
    WebSocket.send(socket, payload) // Echo back
  })
)
```

## Mixing Backends

Multiple backends can coexist; each handles its own file extensions:

```ts
import config from "primate/config";
import go from "@primate/go";
import python from "@primate/python";
import grain from "@primate/grain";

export default config({
  modules: [go(), python(), grain()],
});
```

Routes can be implemented in different languages:

```
routes/
├── auth.go          # Go authentication
├── api.py           # Python data processing
├── websocket.gr     # Grain real-time features
└── admin.rb         # Ruby admin interface
```

## Ecosystem Integration

### Package Management

Each backend uses its native package manager:

- **Go** — `go.mod` and `go get`
- **Grain** — Built-in modules and includes
- **Python** — `requirements.txt` and `pip`
- **Ruby** — `Gemfile` and `bundle`

### External Libraries

Import and use libraries native to each language, compiled to WebAssembly:

```go
// Go
import "encoding/json"
import "crypto/sha256"
```

```python
# Python
import numpy as np
import pandas as pd
```

```ruby
# Ruby
require 'json'
require 'digest'
```
