# Go

This module adds support for writing routes in Golang.

## Install

`npm install @primate/go`

In addition, your system needs to have the `go` executable in its path, as it
is used to compile Go routes into Wasm.

## Configure

Import and initialize the module in your configuration.

```js caption=primate.config.js
import go from "@primate/go";

export default {
  modules: [
    go(),
  ],
};
```

## Use

### Plain text

[JavaScript documentation][plain text]

Strings are served with the content type `text/plain`.

```go caption=routes/plain-text.go
func Get(request Request) any {
  return "Donald";
}
```

This route function handles GET requests to the path `/plain-text` by serving
them the string "Donald" in plain text.

### JSON

[JavaScript documentation][JSON]

Maps (including arrays) are served with the content type `application/json`.

```go caption=routes/json.go
func Get(request Request) any {
  return []any{
    map[string]any{ "name": "Donald" },
    map[string]any{ "name": "Ryan" },
  };
}
```

This route function handles GET requests to the path `/json` by serving them a
JSON array.

For your convenience, Primate furnishes you with two types, `Object` which is
`map[string]any` and `Array` which is `[]any`, allowing you to write the route
more elegantly.

```go caption=routes/json.go
func Get(request Request) any {
  return Array{
    Object{ "name": "Donald" },
    Object{ "name": "Ryan" },
  };
}
```

### Redirect

[JavaScript documentation][redirect]

The `Redirect` handler allows you to redirect responses.

```go caption=routes/redirect.go
import "github.com/primate-run/go/primate"

func Get(request Request) any {
  return primate.Redirect("https://primate.run");
}
```

To use a different redirect status, use the second parameter as a map with a
`status` field.

```go caption=routes/redirect-301.go
import "github.com/primate-run/go/primate"

func Get(request Request) any {
  // moved permanently
  return primate.Redirect("https://primate.run", Object{ "status": 301 });
}
```

### View

[JavaScript documentation][view]

The `View` handler allows you to serve responses with content type `text/html`
from the `components` directory.

```go caption=routes/view.go
import "github.com/primate-run/go/primate"

func Get(request Request) any {
  return primate.View("hello.html");
}
```

In this case, Primate will load the HTML component at `components/hello.html`,
inject the HTML component code into the index file located at `pages/app.html`
and serve the resulting file at the path GET `/html`. In case no such file
exists, Primate will fall back to its [default app.html][default-index].

```html caption=components/hello.html
<p>Hello, world!</p>
```

If you're using any of the supported frontends, you can also pass props
directly to the frontend component.

First, create the frontend component, in this case Svelte.

```svelte caption=components/PostIndex.svelte
<script>
  export let posts;
</script>
<h1>All posts</h1>
{#each posts as { id, title }}
<h2><a href="/post/{id}">{title}</a></h2>
{/each}
<style>
  button {
    border-radius: 4px;
    background-color: #5ca1e1;
    border: none;
    color: #fff;
    display: block;
  }
</style>
```

Then create the route, and pass props to the component.

```go caption=routes/svelte.go
import "github.com/primate-run/go/primate"

func Get(request Request) any {
  posts := Array{Object{
    "id": 1,
    "title": "First post",
  }};

  return primate.View("PostIndex.svelte", Object{ "posts": posts });
}
```

Your rendered route with a Svelte component will be accessible at
http://localhost:6161/svelte.

### The request object

Route verb functions accept a single parameter representing request data. This
aggregate object allows easy access to the request `Body`, any `Path`
parameters defined with braces, the `Query` string split into parts, `Cookies`
as well as other `Headers`.

### Body

[JavaScript documentation][body]

The request body.

```go caption=routes/your-name.go
func Post(request Request) any {
  return "Hello, " + request.Body["name"].(string);
}
```

If a client sends a POST request to `/your-name` using the content type
`application/json` and `{"name": "Donald"}` as body, this route will respond
with 200 saying  `Hello, Donald`.

### Path, Query, Cookies, Headers

[JavaScript documentation][path]

As in JavaScript, these properties work as dispatchers, providing a `Get`
function to access individual properties. In addition, any types defined in
`types` will be available to the dispatcher. The `Dispatcher` struct is defined
as follows.

```go caption=Dispatcher struct
type Dispatcher struct {
  Get func(string) any
  // dynamic runtime type getters
}
```

In addition, any types defined in `types` will be available to a `Dispatcher`.

Suppose you have defined the following type.

```js caption=types/uuid.js
import is from "@rcompat/assert/is";

const valid = /^[^\W_]{8}-[^\W_]{4}-[^\W_]{4}-[^\W_]{4}-[^\W_]{12}$/u;

export default {
  base: "string",
  validate(value) {
    // make sure value is a string, otherwise throw
    is(value).string();

    if (valid.test(value)) {
      return value;
    }
    throw new Error(`${value} is not a valid UUID`);
  },
};
```

The `Dispatcher` struct would now look a little different.

```go caption=Dispatcher struct
type Dispatcher struct {
  Get func(string) any
  GetUuid func(string) (string, error)
}
```

In Javascript, calling `request.query.getUuid("id")` can throw. In Go,
`request.Query.GetUuid("id")` returns a non-`nil` error in case the type's
`validate` function threw.

### Session

[JavaScript documentation][session]

If the `@primate/session` module is active, the `Request` object passed to a
route will contain an additional `Session` property, allowing you to retrieve
and set session data from within Go.

A `Session` struct is as defined as follows.

```go caption=Session struct
type Session struct {
  Exists func() bool
  Get func(string) any
  Set func(string, any) error
  Create func(map[string]any)
  Destroy func()
}
```

Here is a Go route that, in case a session does not exist, creates it with a
`count` equaling 0 and otherwise increments `count` by 1. In both cases, the
session data is served to the client as JSON.

```go caption=routes/session.go
func Get(request Request) any {
  if (!request.Session.Exists()) {
    request.Session.Create(Object{"count": 0});
  } else {
    count := request.Session.Get("count").(float64);
    request.Session.Set("count", count + 1);
  }

  return Object{ "count": request.Session.Get("count") };
}
```

## Configuration options

### extension

Default `".go"`

The file extension associated with Go routes.

## Resources

* [Repository][repo]
* [Error list](/errors/go)

[plain text]: /guide/responses#plain-text
[json]: /guide/responses#json
[redirect]: /guide/responses#redirect
[view]: /guide/responses#view
[body]: /guide/routes#body
[path]: /guide/routes#path
[session]: /modules/session#use
[default-index]:
https://github.com/primate-run/primate/blob/master/packages/core/src/build/defaults/app.html
[repo]: https://github.com/primate-run/primate/tree/master/packages/go
