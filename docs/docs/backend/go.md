---
title: Go backend
---

# Go

Primate runs [Go][Documentation] with WebAssembly compilation, strongly-typed
validation, sessions, and server-side routing.

## Setup

### Install Go

First, install Go 1.25 or later from [go.dev](https://go.dev/dl/).

### Install Module

```bash
npm install @primate/go
```

### Configure

```ts
import config from "primate/config";
import go from "@primate/go";

export default config({
  modules: [go()],
});
```

### Initialize Go

Create a `go.mod` file in your project root:

```bash
go mod init your-project-name
```

Add the Primate Go dependency:

```bash
go get github.com/primate-run/go@latest
```

This creates `go.mod` and `go.sum` files that manage your Go dependencies.

## Routes

Create Go route handlers in `routes` using `.go` files. Routes are compiled to
WebAssembly and run in the JavaScript runtime.

```go
// routes/hello.go
package main

import "github.com/primate-run/go/route"

var _ = route.Get(func(request route.Request) any {
    return "Hello, world!"
})
```

### HTTP Methods

All standard HTTP methods are supported:

```go
package main

import "github.com/primate-run/go/route"

var _ = route.Get(func(request route.Request) any {
    return "GET request"
})

var _ = route.Post(func(request route.Request) any {
    return "POST request"
})

var _ = route.Put(func(request route.Request) any {
    return "PUT request"
})

var _ = route.Delete(func(request route.Request) any {
    return "DELETE request"
})
```

## Request Handling

### Query Parameters

Access query parameters through the `Query` request bag:

```go
// routes/query.go
package main

import "github.com/primate-run/go/route"

var _ = route.Get(func(request route.Request) any {
    if request.Query.Has("foo") {
        foo, _ := request.Query.Get("foo")
        return foo
    }
    return "foo missing"
})
```

### Request Body

Handle different body types based on content:

#### JSON Body

```go
// routes/json.go
package main

import (
    "github.com/primate-run/go/route"
    "github.com/primate-run/go/types"
)

var _ = route.Post(func(request route.Request) any {
    json, err := request.Body.JSON()
    if err != nil {
        return types.Dict{"error": err.Error()}
    }
    return json
})
```

#### Form Fields

```go
// routes/form.go
package main

import (
    "github.com/primate-run/go/route"
    "github.com/primate-run/go/types"
)

var _ = route.Post(func(request route.Request) any {
    form, err := request.Body.Form()
    if err != nil {
        return types.Dict{"error": err.Error()}
    }
    return form
})
```

#### Text Body

```go
// routes/text.go
package main

import "github.com/primate-run/go/route"

var _ = route.Post(func(request route.Request) any {
    text, _ := request.Body.Text()
    return text
})
```

#### Binary Data

```go
// routes/binary.go
package main

import (
    "github.com/primate-run/go/route"
    "github.com/primate-run/go/types"
)

var _ = route.Post(func(request route.Request) any {
    data, mime, err := request.Body.Binary()
    if err != nil {
        return types.Dict{"error": err.Error()}
    }

    head := []int{}
    for i := 0; i < len(data) && i < 4; i++ {
        head = append(head, int(data[i]))
    }

    return types.Dict{
        "type": mime,
        "size": len(data),
        "head": head,
    }
})
```

### File Uploads

Handle multipart file uploads:

```go
// routes/upload.go
package main

import (
    "github.com/primate-run/go/route"
    "github.com/primate-run/go/types"
)

var _ = route.Post(func(request route.Request) any {
    // get form fields
    form, err := request.Body.Form()
    if err != nil {
        return types.Dict{"error": err.Error()}
    }

    // get uploaded files
    files, err := request.Body.Files()
    if err != nil {
        return types.Dict{"error": err.Error()}
    }

    // process files
    for _, file := range files {
        // file.Field - form field name
        // file.Name - original filename
        // file.Type - MIME type
        // file.Size - file size in bytes
        // file.Bytes - file content
    }

    return types.Dict{
        "form": form,
        "files":  len(files),
    }
})
```

## Validation

Use Primate's strongly-typed validation system with the `pema` package:

```go
// routes/validate.go
package main

import (
    "github.com/primate-run/go/route"
    "github.com/primate-run/go/pema"
    "github.com/primate-run/go/types"
)

var schema = pema.Schema(types.Dict{
    "baz": pema.Int(),
    "foo": pema.String(),
})

var _ = route.Get(func(request route.Request) any {
    parsed, err := request.Query.Parse(schema, true)
    if err != nil {
        return err.Error()
    }
    return parsed
})
```

### Field Types

The validation system supports multiple strongly-typed field types:

- `pema.String()` - validates string values
- `pema.Int()` - validates integer values
- `pema.Int64()` - validates 64-bit integer values
- `pema.Float()` - validates float64 values
- `pema.Boolean()` - validates boolean values

### Coercion

Enable automatic type coercion by passing `true` as the second parameter:

```go
parsed, err := r.Query.Parse(schema, true) // enables coercion
```

With coercion enabled:
- Strings are converted to numbers when possible
- Empty strings become `false` for booleans, `0` for numbers
- Numbers are converted between types as needed

## Responses

### Plain Data

Return any Go type that can be JSON serialized:

```go
var _ = route.Get(func(request route.Request) any {
    return types.Dict{"name": "Donald"}
})

var _ = route.Get(func(request route.Request) any {
    return "Hello, world!"
})

var _ = route.Get(func(request route.Request) any {
    return types.Array[types.Dict]{
        {"name": "Donald"},
        {"name": "Ryan"},
    }
})
```

### Views

Render components with props:

```go
// routes/view.go
package main

import (
    "github.com/primate-run/go/response"
    "github.com/primate-run/go/route"
    "github.com/primate-run/go/types"
)

var _ = route.Get(func(request route.Request) any {
    return response.View("index.html", types.Dict{"hello": "world"})
})
```

With options:

```go
var _ = route.Get(func(request route.Request) any {
    return response.View("index.html",
        types.Dict{"hello": "world"},
        types.Dict{"partial": true},
    )
})
```

### Redirects

Redirect to another route:

```go
// routes/redirect.go
package main

import (
    "github.com/primate-run/go/response"
    "github.com/primate-run/go/route"
)

var _ = route.Get(func(request route.Request) any {
    return response.Redirect("/redirected")
})
```

With custom status code:

```go
var _ = route.Get(func(request route.Request) any {
    return response.Redirect("/redirected", 301) // moved permanently
})
```

### Error Responses

Return error responses:

```go
// routes/error.go
package main

import (
    "github.com/primate-run/go/response"
    "github.com/primate-run/go/route"
)

var _ = route.Get(func(request route.Request) any {
    return response.Error()
})
```

With custom error options:

```go
var _ = route.Get(func(request route.Request) any {
    return response.Error(types.Dict{"body": "Custom error message"})
})
```

## Sessions

Manage user sessions with the session package:

```go
// routes/session.go
package main

import (
    "github.com/primate-run/go/route"
    "github.com/primate-run/go/session"
    "github.com/primate-run/go/types"
)

var _ = route.Get(func(request route.Request) any {
    // create a session
    session.Create(types.Dict{"foo": "bar"})

    // get session data
    return session.Get()
})
```

### Session Methods

- `session.Create(data)` - creates a new session with data
- `session.Get()` - gets session data (throws if no session)
- `session.Try()` - gets session data (returns empty if no session)
- `session.Set(data)` - updates session data
- `session.Destroy()` - destroys the session
- `session.Exists()` - checks if session exists
- `session.Id()` - gets the session ID

## Types

Primate Go provides convenient type aliases in the `core` package for common
data structures:

```go
import "github.com/primate-run/go/core"

// dictionary (map[string]any)
data := core.Dict{"key": "value", "count": 42}

// generic object with typed values
user := core.Object[string]{"name": "John", "role": "admin"}

// generic array with typed elements
names := core.Array[string]{"Alice", "Bob", "Charlie"}

// array of dictionaries
users := core.Array[core.Dict]{
    {"name": "Donald"},
    {"name": "Ryan"},
}
```

## Configuration

| Option        | Type     | Default | Description               |
| ------------- | -------- | ------- | ------------------------- |
| fileExtension | `string` | `".go"` | Associated file extension |

### Example

```ts
import go from "@primate/go";
import config from "primate/config";

export default config({
  modules: [
    go({
      // use `.golang` as associated file extension
      fileExtension: ".golang",
    }),
  ],
});
```

## Resources

- [Documentation]
- [Go Language Specification](https://go.dev/ref/spec)
- [WebAssembly Support](https://github.com/golang/go/wiki/WebAssembly)

[Documentation]: https://go.dev
