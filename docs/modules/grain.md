# Grain

This module adds support for writing routes in [Grain].

## Install

`npm install @primate/grain`

In addition, your system needs to have the `grain` executable in its path, as it
is used to compile Grain routes into Wasm.

## Configure

Add the module to your configuration.

```js caption=config/app.ts
import grain from "@primate/grain";
import config from "primate/config";

export default config({
  modules: [grain()],
});
```

## Use

### Plain text

[JavaScript documentation][plain text]

Strings are served with the content type `text/plain`.

```rs caption=routes/plain-text.gr
module PlainText

from "primate/request" include Request
from "primate/response" include Response

use Request.{ type Request }

provide let get = (request: Request) => "Donald"
```

This route function handles GET requests to the path `/plain-text` by serving
them the string "Donald" in plain text.

### JSON

[JavaScript documentation][JSON]

Use Grain's `Json` type to serve JSON.

```rs caption=routes/json.grain
module PrimateJson

from "primate/response" include Response
from "primate/request" include Request
from "json" include Json

use Request.{ type Request }
use Json.{ type Json }

provide let get = (request: Request) => JsonArray([
  JsonObject([("name", JsonString("Donald"))]),
  JsonObject([("name", JsonString("Ryan"))]),
])
```

This route function handles GET requests to the path `/json` by serving them a
JSON array.

### Redirect

[JavaScript documentation][redirect]

The `Redirect` handler allows you to redirect responses.

```rs caption=routes/redirect.gr
module Redirect

from "primate/request" include Request
from "primate/response" include Response
use Response.{ type Response }
use Request.{ type Request }

provide let get = (request: Request) =>
  Response.redirect("https://primate.run");
```

To use a different redirect status, use the second parameter as a map with a
`status` field.

```rs caption=routes/redirect-301.gr
module RedirectStatus

from "primate/request" include Request
from "primate/response" include Response

use Response.{ type Response, type HTTPStatus }
use Request.{ type Request }

provide let get = (request: Request) =>
  Response.redirect("https://primate.run", status = Some(MovedPermanently))
}
```

### View

[JavaScript documentation][view]

The `View` handler allows you to serve responses with content type `text/html`
from the `components` directory.

```rs caption=routes/view.gr
module View

from "primate/request" include Request
from "primate/response" include Response
from "json" include Json

use Response.{ type Response }
use Request.{ type Request }

provide let get = (request: Request) => Response.view(
  "hello.html",
  props = JsonObject([("hello", JsonString("world"))]),
)
```

In this case, Primate will load the HTML component at `components/hello.html`,
inject the HTML component code into the index file located at `pages/app.html`
and serve the resulting file at the GET `/html` path. In case no such file
exists, Primate will fall back to its [default app.html][default-index].

```html caption=components/hello.html
<p>Hello, world!</p>
```

## Configuration options

### extension

Default `".gr"`

The file extension associated with Grain routes.

## Resources

* [Repository][repo]

[plain text]: /guide/responses#plain-text
[json]: /guide/responses#json
[redirect]: /guide/responses#redirect
[view]: /guide/responses#view
[repo]: https://github.com/primate-run/primate/tree/master/packages/grain
[Grain]: https://grain-lang.org
