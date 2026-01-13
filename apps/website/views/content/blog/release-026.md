---
title: Release 0.26: Go Wasm routes, live reload, and HTMX extensions
epoch: 1699820750000
author: terrablue
---
Today we're announcing the availability of the Primate 0.26 preview release.
This release introduces support for Go Wasm routes, live reload using the new
`@primate/build` module, and HTMX extensions.

!!!
If you're new to Primate, we recommend reading the [Getting started] page to
get an idea of the framework.
!!!

## Go Wasm routes

Primate is one of the first frameworks to offer writing backend logic in
different languages. In addition to its native support of JavaScript, you can
now write your route handlers in Go, using a nearly identical API. This gives
you access to Go's standard library, but also the entire Go ecosystem when
writing backend logic.

We believe this is an important step towards allowing more developers access to
frontend frameworks with all their features -- SSR, hydration, and client side
rendering.

### Install

To add support for Go, install the `@primate/go` module.

`npm install @primate/go`

In addition, your system needs to have the `go` executable in its path, as it
is used to compile Go routes into WebAssembly.

### Configure

Import and initialize the module in your configuration.

```js caption=primate.config.js
import go from "@primate/go";

export default {
  modules: [
    go(),
  ],
};
```

### Use

When writing routes, you can pretty much do everything you can do in JavaScript
routes, in Go. For example, if you return strings or maps from your Go route,
Primate will serve them as content type `text/plain` and `application/json`,
respectively.

```go caption=routes/index.go
func Get(request Request) any {
  return "Donald";
}

func Post(request Request) any {
  return map[string]any{
    "name": "Donald",
  };
}
```

If you send a GET request to `/`, you will see a plain text response of
`"Donald"`. For POST, you'll see a JSON response with `{"name": "Donald"}`.

For your convenience, Primate furnishes you with two types, `Object` which is
`map[string]any` and `Array` which is `[]any`. If you're returning a JSON
containing an array, you would write the following route.

```go caption=routes/json-array.go
func Get(request Request) any {
  return Array{
    Object{ "name": "Donald" },
    Object{ "name": "Ryan" },
  };
}
```

Accessing GET at `/json-array` will return a JSON array with this data.

```json
[
  { "name": "Donald" },
  { "name": "Ryan" }
]
```

In addition, much like with JavaScript routes, you have access to a `Request`
object that exposes several properties.

```go caption=Request struct
type Request struct {
  Url URL
  Body Dispatcher
  Path Dispatcher
  Query Dispatcher
  Cookies Dispatcher
  Headers Dispatcher
  // dynamic properties
}
```

A `Dispatcher`, much like in JavaScript, allows you to query for subproperties
of the field.

```go caption=Dispatcher struct
type Dispatcher struct {
  Get func(string) any
  All func() map[string]any
  // dynamic runtime type getters
}
```

For example, if a GET request is sent to `/?name=Donald`, it could be served by
the following route, returning the value of the query string parameter `name`
as plain text.

```go caption=routes/index.go
func Get(request Request) any {
  // on GET /?name=Donald -> responds with text/plain "Donald"
  return request.Query.Get("name").(string);
}
```

For the full documentation of Go routes, see the [Go module documentation].


## Future of WebAssembly in Primate

With Go Wasm supported in Primate, we are working on supporting additional
programming languages in Primate and improving the Go API compatibility to match
that of JavaScript. As WASI becomes more mature and is supported by more
programming languages and runtimes, we intend to move to that.

If you have a particular language you wish to see supported in Primate routes,
please open an issue describing your use case.

## Live reload

This release features a rewritten `@primate/build` module, formerly named
`@primate/esbuild`. The `esbuild` export of this module now bundles your
application both in development (`npx primate`) and production (`npx primate
serve`) mode. In development mode, this module will insert a small client-side
script that reloads the browser whenever you edit and save a component.

For more information, see the `@primate/build` [documentation page][build].

## HTMX extensions

Primate now supports HTMX extensions, using an ESM version of HTMX (`htmx-esm`
package) instead of the `htmx.org` package.

To use an HTMX extension, pass it to the HTMX module's `extensions` array
property in your Primate configuration.

```js primate.config.js
import htmx from "@primate/htmx";

export default {
  modules: [
    htmx({
      extensions: ["head-support"],
    }),
  ],
};
```

If you're using the `client-side-templates` extension, include the individual
client side templates in the `client_side_templates` array property.

```js primate.config.js
import htmx from "@primate/frontend/htmx";

export default {
  modules: [
    htmx({
      extensions: ["client-side-templates", "head-support"],
      client_side_templates: ["handlebars", "mustache"],
    }),
  ],
};
```

## Migrating from 0.25

### Use all() instead of get()

Change any uses of `request.{body, path, query, cookies, headers}.get` without
parameters to `all`. Previously, the `get` function on a dispatcher could be
called with a property, in which case it would retrieve that property's value
(or `undefined`), or without a property, which would return the entire
underlying object.

The latter case has been now extracted from `get` into `all`. Calling
`dispatcher.get` without a string argument in 0.26 will throw.

### New: request.session.all()

A `request.session` object is now similar to a dispatcher in that that it has
both `get` and `all`, to query individual session properties and the entire
session data. Like real dispatchers, `get` will throw if called without
arguments or with a non-string first argument.

### Depend on htmx-esm instead of htmx.org

As HTMX extensions are now supported, HTMX had to be repackaged in an ESM
friendly way that allows bundling extensions. If you use the `@primate/frontend`
module with HTMX, make sure to remove the `htmx.org` dependency and install
`htmx-esm` instead. Primate will error out if you're missing `htmx-esm`.

### Use @primate/build instead of @primate/esbuild

The `@primate/esbuild` package has been renamed `@primate/build`. If you
previously  used `@primate/esbuild` with its default export, install
`@primate/build` and  change your configuration to use the `esbuild` export of
`@primate/build`. Remove the old `@primate/esbuild` package.

```js primate.config.js
// old: import esbuild from "@primate/esbuild";
import { esbuild } from "@primate/build";

export default {
  modules: [
    esbuild(),
  ],
};
```

As `esbuild` has become a peer dependency, you will also now need to install
it explicitly using `npm install esbuild`. Primate will error out if you're
missing it.

### Convert type functions to type objects

In 0.26, it is no longer possible to export a runtime type as a function. All
runtime types must instead export an object with `base` string and a  `validate`
function property. Change any runtime type functions to the new object format.

```js types/uuid.js
const uuid = /^[^\W_]{8}-[^\W_]{4}-[^\W_]{4}-[^\W_]{4}-[^\W_]{12}$/u;

// before
/*
export default value => {
  if (uuid.test(value)) {
    return value;
  }

  throw new Error(`${JSON.stringify(value)} is not a valid UUID`);
};
*/

// now
export default {
  base: "string",
  validate(value) {
    if (uuid.test(value)) {
      return value;
    }

    throw new Error(`${JSON.stringify(value)} is not a valid UUID`);
  },
};
```

## Other changes

Consult the [full changelog][changelog] for a list of all relevant changes.

## Next on the road

Some of the things we plan to tackle in the upcoming weeks are,

* Add projections and relations to stores
* Multidriver transactions
* Introduce IDE TypeScript support
* Add support for TypeScript (.ts) routes
* Add a `command` hook that would allow modules to register command line
  namespaces, to be able to run `npx primate [namespace] [command] [flags]`
* Use this new hook to create database migrations for SQL-flavored databases
* Add hydration and liveview support for `@primate/vue`
* Support the `multipart/form-data` content type
* Flesh out stores with default values, additional predicates and relations
  between tables/collections
* Add more type variants

This list isn't exhaustive or binding. None, some or all of these features may
be included in 0.27, and other features may be prioritized according to
feedback.

## Fin

If you like Primate, consider [joining our channel #primate][irc] on
irc.libera.chat.

Otherwise, have a blast with the new version!

[Getting started]: /guide/getting-started
[irc]: https://web.libera.chat#primate
[last release]: https://primate.run/blog/release-025
[changelog]: https://github.com/primate-run/primate/releases/tag/0.26.0
[Go module documentation]: /modules/go
[build]: /modules/build
