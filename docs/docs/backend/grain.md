# Grain

Primate runs [Grain][Documentation] with WebAssembly compilation,
strongly-typed validation, sessions, and server-side routing.

## Setup

### Install Grain

First, install Grain from the [official website][Grain]. Make sure the
`grain` command is available in your `PATH`.

### Install Module

```bash
npm install @primate/grain
```

### Configure

```ts
import config from "primate/config";
import grain from "@primate/grain";

export default config({
  modules: [grain()],
});
```

## Routes

Create Grain route handlers in `routes` using `.gr` files. Routes are
compiled to WebAssembly and run in the JavaScript runtime.

```grain
// routes/hello.gr
module Hello

from "primate/request" include Request
from "json" include Json

use Request.{ type Request }
use Json.{ type Json }

provide let get = (request: Request) =>
  JsonObject([("message", JsonString("Hello, world!"))])
```

### HTTP Methods

All standard HTTP methods are supported by providing the appropriate
functions:

```grain
module Routes

from "primate/request" include Request
from "json" include Json

use Request.{ type Request }
use Json.{ type Json }

provide let get = (request: Request) =>
  JsonString("GET request")

provide let post = (request: Request) =>
  JsonString("POST request")

provide let put = (request: Request) =>
  JsonString("PUT request")

provide let delete = (request: Request) =>
  JsonString("DELETE request")
```

## Request Handling

### Query Parameters

Access query parameters through the request object:

```grain
// routes/query.gr
module Query

from "primate/request" include Request
from "map" include Map
from "option" include Option
from "json" include Json

use Request.{ type Request }
use Json.{ type Json }

provide let get = (request: Request) => {
  let query = Request.getQuery(request)
  match (Map.get("foo", query)) {
    Some(value) => JsonString(value),
    None => JsonString("foo missing")
  }
}
```

### Request Body

Handle different body types based on content:

#### JSON Body

```grain
// routes/json.gr
module JsonRoute

from "primate/request" include Request
use Request.{ type Request, module Body }

provide let post = (request: Request) => Body.json(request)
```

#### Form Fields

```grain
// routes/form.gr
module Form

from "primate/request" include Request
from "map" include Map
from "json" include Json

use Request.{ type Request, module Body, module BodyField }
use Json.{ type Json }

provide let post = (request: Request) => {
  let fields = Body.fields(request)

  let pairs = Map.reduce((acc, key, value) => {
    let stringValue = BodyField.string(value)
    [(key, JsonString(stringValue)), ...acc]
  }, [], fields)

  JsonObject(pairs)
}
```

#### Text Body

```grain
// routes/text.gr
module Text

from "primate/request" include Request

use Request.{ type Request, module Body }

provide let post = (request: Request) => Body.text(request)
```

#### Binary Data

```grain
// routes/binary.gr
module Binary

from "primate/request" include Request
from "json" include Json
from "bytes" include Bytes
from "uint8" include Uint8

use Request.{ type Request, module Body, type Blob }
use Json.{ type Json }

provide let post = (request: Request) => {
  let { mimeType, bytes }: Blob = Body.blob(request)

  let byteLength = Bytes.length(bytes)
  let mut values = []

  for (let mut i = byteLength - 1; i >= 0; i -= 1) {
    let value = JsonNumber(Uint8.toNumber(Bytes.getUint8(i, bytes)))
    values = [value, ...values]
  }

  JsonObject([
    ("type", JsonString(mimeType)),
    ("size", JsonNumber(byteLength)),
    ("head", JsonArray(values)),
  ])
}
```

### File Uploads

Handle multipart file uploads:

```grain
// routes/upload.gr
module Upload

from "primate/request" include Request
from "map" include Map
from "option" include Option
from "json" include Json
from "bytes" include Bytes

use Request.{
  type Request,
  module Body,
  module BodyFieldsElement,
  type FileLike
}
use Json.{ type Json }

provide let post = (request: Request) => {
  let fields = Body.fields(request)

  // Process regular fields
  let regularFields = Map.reduce((acc, key, value) => {
    match (value) {
      BodyFieldsElementString(str) => [(key, JsonString(str)), ...acc],
      _ => acc
    }
  }, [], fields)

  // Process file fields
  let fileFields = Map.reduce((acc, key, value) => {
    match (value) {
      BodyFieldsElementFile({ name, mimeType, bytes }) => {
        let content = Bytes.toString(bytes)
        let fileInfo = JsonObject([
          ("name", JsonString(name)),
          ("type", JsonString(mimeType)),
          ("size", JsonNumber(Bytes.length(bytes))),
          ("content", JsonString(content))
        ])
        [(key, fileInfo), ...acc]
      },
      _ => acc
    }
  }, [], fields)

  JsonObject([
    ("fields", JsonObject(regularFields)),
    ("files", JsonObject(fileFields))
  ])
}
```

## Responses

### Plain Data

Return JSON data by constructing Json values:

```grain
provide let get = (request: Request) =>
  JsonObject([("name", JsonString("Donald"))])

provide let get = (request: Request) =>
  JsonString("Hello, world!")

provide let get = (request: Request) =>
  JsonArray([
    JsonObject([("name", JsonString("Donald"))]),
    JsonObject([("name", JsonString("Ryan"))])
  ])
```

### Views

Render components with props using the Response module:

```grain
// routes/view.gr
module View

from "primate/request" include Request
from "primate/response" include Response
from "json" include Json

use Response.{ type Response }
use Request.{ type Request }

provide let get = (request: Request) => Response.view(
  "index.html",
  props = JsonObject([("hello", JsonString("world"))]),
)
```

With options:

```grain
provide let get = (request: Request) => Response.view(
  "index.html",
  props = JsonObject([("hello", JsonString("world"))]),
  partial = true,
)
```

### Redirects

Redirect to another route:

```grain
// routes/redirect.gr
module Redirect

from "primate/request" include Request
from "primate/response" include Response

use Response.{ type Response }
use Request.{ type Request }

provide let get = (request: Request) => Response.redirect("/redirected")
```

With custom status code:

```grain
provide let get = (request: Request) =>
  Response.redirect("/redirected", status = Some(MovedPermanently))
```

### Error Responses

Return error responses:

```grain
// routes/error.gr
module Error

from "primate/request" include Request
from "primate/response" include Response

use Response.{ type Response }
use Request.{ type Request }

provide let get = (request: Request) => Response.error()
```

With custom error options:

```grain
provide let get = (request: Request) =>
  Response.error(body = Some("Custom error message"))
```

## Sessions

Manage user sessions with the session module:

```grain
// routes/session.gr
module Session

from "json" include Json
from "primate/request" include Request
from "primate/response" include Response
from "primate/session" include Session
from "option" include Option

use Session.{ type Session }
use Request.{ type Request }
use Response.{ type Response }

provide let get = (request: Request) => {
  // Create a session
  Session.create(JsonObject([("foo", JsonString("bar"))]))

  // Get session data
  let session = Option.expect("Session must exist", Session.get())
  Response.json(session.data)
}
```

### Session Methods

- `Session.create(data)` - creates a new session with data
- `Session.get()` - gets session data (returns Option<Session>)
- `Session.exists()` - checks if session exists
- `Session.set(data)` - updates session data

## Database Operations

Primate Grain includes built-in database operations through the Store
module:

```grain
// routes/db.gr
module Database

from "json" include Json
from "primate/request" include Request
from "primate/store" include Store
from "result" include Result

use Json.{ type Json }
use Request.{ type Request }

let UserStore = Result.expect("User Store must exist", Store.store("User"))

provide let get = (request: Request) => {
    // Clear existing data
    Result.expect("Clear must succeed", Store.clear(UserStore))

    // Insert new records
    let user1 = Result.expect("Insert must succeed",
      Store.insert(UserStore, JsonObject([
        ("age", JsonNumber(30)),
        ("name", JsonString("Donald"))
      ])))

    let user2 = Result.expect("Insert must succeed",
      Store.insert(UserStore, JsonObject([
        ("age", JsonNumber(40)),
        ("name", JsonString("Ryan"))
      ])))

    // Get count
    let count = Result.expect("Count must succeed", Store.count(UserStore))

    JsonObject([("count", JsonNumber(count))])
}
```

### Store Operations

- `Store.store(name)` - get a store instance by name
- `Store.insert(store, data)` - insert a record
- `Store.get(store, id)` - get a record by ID
- `Store.find(store, criteria)` - find records matching criteria
- `Store.update(store, id, data)` - update a record
- `Store.delete(store, criteria)` - delete records
- `Store.deleteById(store, id)` - delete a record by ID
- `Store.has(store, id)` - check if record exists
- `Store.count(store)` - count records
- `Store.clear(store)` - clear all records

## WebSocket Support

Create WebSocket endpoints for real-time communication:

```grain
// routes/websocket.gr
module Ws

from "primate/request" include Request
from "primate/response" include Response
from "primate/websocket" include WebSocket

use Response.{ type Response }
use Request.{ type Request }
use WebSocket.{ type SocketMessage, type WebSocket, send }

provide let get = (req: Request) => {
  Response.ws(
    open = Some((_socket) => {
      print("WebSocket opened!")
    }),
    message = Some((socket: WebSocket, payload: SocketMessage) => {
      // Echo the message back
      send(socket, payload)
    }),
  )
}
```

### WebSocket Methods

- `WebSocket.send(socket, message)` - send a message to the client
- `WebSocket.close(socket)` - close the WebSocket connection

## Grain Language Features

### Pattern Matching

Grain's pattern matching makes request handling elegant:

```grain
provide let post = (request: Request) => {
  match (request.body) {
    BodyString(text) => JsonString("Received text: " ++ text),
    BodyJson(json) => json,
    BodyNull => JsonString("No body provided"),
    _ => JsonString("Unsupported body type")
  }
}
```

### Option and Result Types

Handle errors safely with Grain's type system:

```grain
provide let get = (request: Request) => {
  let query = Request.getQuery(request)
  match (Map.get("id", query)) {
    Some(id) => {
      match (Store.get(UserStore, id)) {
        Ok(user) => user,
        Err(_) => JsonObject([("error", JsonString("User not found"))])
      }
    },
    None => JsonObject([("error", JsonString("ID parameter required"))])
  }
}
```

### Immutable Data Structures

Grain uses immutable data structures by default:

```grain
provide let post = (request: Request) => {
  let baseData = JsonObject([("created", JsonString("2024-01-01"))])
  let requestData = Body.json(request)

  // Combine data immutably
  match (requestData) {
    JsonObject(pairs) => {
      JsonObject([("created", JsonString("2024-01-01")), ...pairs])
    },
    _ => baseData
  }
}
```

## Configuration

| Option           | Type     | Default | Description                     |
| ---------------- | -------- | ------- | ------------------------------- |
| command          | `string` | `grain` | Grain compiler command          |
| fileExtension    | `string` | `".gr"` | Associated file extension       |
| includeDirs      | `array`  | `[]`    | Additional include directories  |
| noPervasives     | `bool`   | `false` | Disable pervasive imports       |
| stdlib           | `string` | `null`  | Custom standard library path    |
| strictSequence   | `bool`   | `false` | Enable strict sequence checking |

### Example

```ts
import grain from "@primate/grain";
import config from "primate/config";

export default config({
  modules: [
    grain({
      // use custom grain command
      command: "/usr/local/bin/grain",
      // use `.grain` as associated file extension
      fileExtension: ".grain",
      // add custom include directories
      includeDirs: ["./lib/grain"],
      // enable strict sequence checking
      strictSequence: true,
    }),
  ],
});
```

## Grain Module Structure

Each route file should follow this structure:

```grain
module ModuleName

// Imports
from "primate/request" include Request
from "primate/response" include Response
from "json" include Json

// Type annotations
use Request.{ type Request }
use Json.{ type Json }

// Exception definitions (if needed)
exception CustomError

// Helper functions
let helperFunction = (param) => {
  // implementation
}

// Route handlers (must be provided)
provide let get = (request: Request) => {
  // implementation
}

provide let post = (request: Request) => {
  // implementation
}
```

## Resources

- [Grain Language Documentation](https://grain-lang.org/)
- [Grain Language Reference](https://grain-lang.org/docs/)
- [WebAssembly with Grain](https://grain-lang.org/docs/getting_grain/)

[Documentation]: https://grain-lang.org/
[Grain]: https://grain-lang.org/
