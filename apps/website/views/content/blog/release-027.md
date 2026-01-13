---
title: Release 0.27: Python routes and quality of life improvements
epoch: 1701017546000
author: terrablue
---
Today we're announcing the availability of the Primate 0.27 preview release.
This release introduces support for Python routes and several quality of life
improvements.

!!!
If you're new to Primate, we recommend reading the [Getting started] page to
get an idea of it.
!!!

## Python routes

Following up on our introduction of Go Wasm routes, this release extends the
number of backend languages we support to three by adding Python support. As
Wasm support hasn't been mainlined in Python yet, Primate uses `pyodide` under
the hood to support Python.

Primate has thus become the first platform to combine Python on the backend
with full support for a plethora of frontend frameworks such as Svelte, React
or Solid -- including SSR, hydration, and client side rendering.

### Install

To add support for Python, install the `@primate/python` package.

`npm install @primate/python`

### Configure

Import and initialize the module in your configuration.

```js caption=primate.config.js
import python from "@primate/python";

export default {
  modules: [
    python(),
  ],
};
```

`pyodide` supports loading packages from PyPI. Add any packages (beyond the
standard library) you'd like to use to the `packages` configuration array of
the module.

```js caption=primate.config.js
import python from "@primate/python";

export default {
  modules: [
    python({
      // then later in your Python route, use `import numpy`
      packages: ["numpy"],
    }),
  ],
};
```
### Use

When writing routes, you can pretty much do everything you can do in JavaScript
routes, in Python. For example, if you return strings or dictionaries from your
Python route, Primate will serve them as content type `text/plain` and
`application/json`, respectively.

```py caption=routes/index.py
def get(request):
    return "Donald"

def post(request):
    return { "name": "Donald" }
```

If you send a GET request to `/`, you will see a plain text response of
`"Donald"`. For POST, you'll see a JSON response with `{"name": "Donald"}`.

In addition, much like with JavaScript routes, you have access to a `request`
object that exposes the same properties as in JavaScript.

For example, if a GET request is sent to `/?name=Donald`, it could be served by
the following route, returning the value of the query string parameter `name`
as plain text.

```py caption=routes/index.py
def get(request):
  # on GET /?name=Donald -> responds with text/plain "Donald"
  return request.query.get("name")
```

For the full documentation of Python routes, see the
[Python module documentation].

## Future of WebAssembly in Primate

With Go and Python Wasm supported in Primate, we are working on supporting
additional languages in Primate and improving existing API compatibility to
match that of JavaScript. As WASI matures and is supported by more environments,
we intend to move on to that.

If you have a particular language you wish to see supported in Primate routes,
please open an issue describing your use case.

## Quality of life improvements

This release introduces several quality of life improvements.

### Dots in route names

It was previously impossible to use dots in the names of routes. This
restriction is now removed, allowing you to fake dynamic routes as static
resources by creating route files for them.

```js caption=routes/sitemap.xml.js
export default {
  // serve on GET /sitemap.xml
  get() {
    // dynamically serve a sitemap file
  },
};
```

### Customs headers in view handler

Combined with support for dots in route names, it is now possible to override
the default content type (`text/html`) or any other header when using the `view`
handler. This is particularly useful case you're using a template engine such
as Handlebars to generate an XML file.

```js caption=routes/sitemap.xml.js
import view from "primate/handler/view";
import { xml } from "@rcompat/http/mime";

// this assumes you've imported and loaded the `handlebars` module from
// `@primate/frontend`
export default {
  // serve on GET /sitemap.xml
  get() {
    // load data and save it in a variable `pages`
    // ...

    const headers = { "Content-Type": xml };

    // serve Handlebars template as XML
    return view("sitemap.hbs", { pages }, { headers });
  },
};
```

### Stop layouts from recursing upwards

Layouts in Primate work such that content returned by layout files in inner
directories is placed inside layouts higher in the routes directory hierarchy,
recursively

You may sometimes wish for this upwards recursion to halt at a particular
layout, and this is now achievable by using `export const recursive = false;`
within the `+layout.js` file.

```js caption=routes/inner/+layout.js
import view from "primate/handler/view" ;

export default () => {
  return view("inner-layout.svelte");
};

export const recursive = false;
```

If a file `routes/+layout.js` exists, it will be bypassed for any routes using
the layout `routes/inner/+layout.js` (routes in `routes/inner` or below).

### Async guards

Guards can now be defined as async functions. This allows you to properly use
async operations such as those exposed by `request.store`.

## Migrating from 0.26

### request.body instead of request.body.all()

As of this release we differentiate between how `request.body` and
`request.{path,query,cookies,headers}` behave. `request.body`'s properties
are now accessed directly instead of with `request.body.all()` before.

This change also applies to the Go backend, where request.Body is now a
`map[string]any`.

### .all removed from dispatchers

Dispatchers (`request.{path,query,headers,cookies}`) no longer expose a `.all`
method.

This change also applies to the Go backend, where `Dispatcher` no longer has an
`All` function.

### .all removed from request.session

`request.session` no longer exposes a `.all` method.

This change also applies to the Go backend, where `Session` no longer has an
an `All` function.

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
be included in 0.28, and other features may be prioritized according to
feedback.

## Fin

If you like Primate, consider [joining our channel #primate][irc] on
irc.libera.chat.

Otherwise, have a blast with the new version!

[Getting started]: /guide/getting-started
[irc]: https://web.libera.chat#primate
[last release]: https://primate.run/blog/release-026
[changelog]: https://github.com/primate-run/primate/releases/tag/0.27.0
[Python module documentation]: /modules/python
[build]: /modules/build
