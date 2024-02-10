# Configuration

Primate is a zero-configuration framework and can be used without a custom
configuration. In most cases the defaults can be left as is.

## primate.config.js

If Primate doesn't find a `primate.config.js` in your project root directory
(the directory where your `package.json` resides) or this file does not export
a default object, Primate will fall back to its default configuration file.

```js caption=default configuration
import { identity } from "rcompat/function";
import { Logger } from "primate";

export default {
  base: "/",
  modules: [],
  pages: {
    index: "app.html",
    error: "error.html",
  },
  logger: {
    level: Logger.Warn,
    trace: false,
  },
  http: {
    host: "localhost",
    port: 6161,
    csp: {
      "default-src": "'self'",
      "style-src": "'self'",
      "script-src": "'self'",
      "object-src": "'none'",
      "frame-ancestors": "'none'",
      "form-action": "'self'",
      "base-uri": "'self'",
    },
    static: {
      root: "/",
    },
  },
  location: {
    components: "components",
    pages: "pages",
    routes: "routes",
    static: "static",
    types: "types",
    build: "build",
    client: "client",
    server: "server",
  },
  build: {
    includes: [],
    index: "index.js",
    transform: {
      paths: [],
      mapper: identity,
    },
  },
  types: {
    explicit: false,
  },
};
```

In case you want to override the defaults, create a `primate.config.js` file
in your project root. Primate will read it and merge any overrides with the
default configuration.

To illustrate this, if you wanted to change the default logging level to
`Info` instead of `Warn` and the HTTP port to `6262` you would create a
`primate.config.js` in your project root with the following overrides.

```js caption=custom configuration
import { Logger } from "primate";

export default {
  logger: {
    level: Logger.Info,
  },
  http: {
    port: 6262,
  },
};
```

Primate will merge your custom configuration with its default, resulting in
effectively the following configuration.

```js caption=merged configuration
import { identity } from "rcompat/function";
import { Logger } from "primate";

export default {
  base: "/",
  modules: [],
  pages: {
    index: "app.html",
    error: "error.html",
  },
  logger: {
    level: Logger.Info,
    trace: false,
  },
  http: {
    host: "localhost",
    port: 6262,
    csp: {
      "default-src": "'self'",
      "style-src": "'self'",
      "script-src": "'self'",
      "object-src": "'none'",
      "frame-ancestors": "'none'",
      "form-action": "'self'",
      "base-uri": "'self'",
    },
    static: {
      root: "/",
    },
  },
  location: {
    components: "components",
    pages: "pages",
    routes: "routes",
    static: "static",
    types: "types",
    build: "build",
    client: "client",
    server: "server",
  },
  build: {
    includes: [],
    index: "index.js",
    transform: {
      paths: [],
      mapper: identity,
    },
  },
  types: {
    explicit: false,
  },
};
```

## General options

### base

Default `"/"`

Your app's base path. If your app is running from a domain's root path, leave
the default as is. If your app is running from a subpath, adjust accordingly.

This is used in CSP paths.

### modules

Default `[]`

Instantiated modules. The order of loading modules affects the order in which
their hooks will be evaluated, and modules can depend on each using
[load hooks][hooks-load].

## Page options

### index

Default: `app.html`

Name of the default HTML page located in `location.pages`. If `location.pages`
does not exist or contain this file, Primate will use its
[default app.html][default-app-html].

### error

Default: `error.html`

Name of the default error HTML page located in `location.pages`. If
`location.pages` does not exist or contain this file, Primate will use its
[default error.html][default-error-html].

## Logging options

For more info on logging, refer to the [Logging in Primate](/guide/logging)
section.

### logger.level

Default `Logger.Warn`

The logging level to be used. Primate has three logging levels, `Error`, `Warn`
and `Info`.

### logger.trace

Default `false`

Whether Primate should show the original stack trace of errors in addition to
its own errors.

## HTTP options

Configuring the underlying HTTP server.

### http.host

Default `"localhost"`

The HTTP host to be used. This value is directly passed to the runtime.

### http.port

Default `6161`

The HTTP port to be used. This value is directly passed to the runtime.

### http.csp

Default

```js
{
// all content must come from own origin, excluding subdomains
"default-src": "'self'",
// styles must come from own origin, excluding subdomains
"style-src": "'self'",
// disallow <object>, <embed> and <applet> elements
"object-src": "'none'",
// disallow embedding
"frame-ancestors": "'none'",
// all form submissions must be to own origin
"form-action": "'self'",
// allow only own origin in <base>
"base-uri": "'self'",
}
```

The Content Security Policy (CSP) to be used. Primate's defaults are intended
to be secure, and you would need to change them for decreased security.

### http.static.root

Default `"/"`

The path at which to serve static assets (those located in the `static`
directory and copied during runtime to the `build/client/static` directory).
Static assets take precedence over routes. This option allows you to have all
static assets served at a subpath, like `/public`.

### http.ssl.{ key, cert }

Default: `undefined`

The path to an SSL key and certificate pair. If both these properties are set
and point to a valid key/certificate pair, Primate will switch to https.
If specified as a relative path, will be relative to project root.

!!!
Primate does not load the key or certificate into memory. It only resolves
their paths as necessary and passes them to the [rcompat](https://github.com/rcompat/rcompat).
!!!

### Location options

Locations of Primate standard directories. If any of these locations are
relative, they will be relative to project root.

### location.components

Default `"components"`

The directory where components are located. [Components](/guide/components) are
used as HTML files or by frontend frameworks. The `view` handler will try to
load any referenced component filename from this directory.

### location.pages

Default `"pages"`

The directory where pages are loaded from. If this directory doesn't exist and
you use the `view` or `html` handler, Primate will use its default `app.html`
as the default page.

### location.routes

Default `"routes"`

The directory where the hierarchy of route files resides.

### location.static

Default `"static"`

The directory from which static assets are copied to the build directory at
`{location.build}/{location.static}`, where `location.build` and
`location.static` are configuration options.

### location.types

Default `"types"`

The directory where types are located. [Types](/guide/types) can be
used to limit the range of possible values that a variable can hold.

### location.build

Default `"build"`

The directory where the app is to be built in and served from. This directory
is recreated during every run.

### location.client

The directory into which client files (compiled components, modules) are copied
and from which they are served at runtime.

### location.server

The directory into which server files (compiled components) are copied and from
which they are server-rendered at runtime.

### Build options

Modifying aspects of the build system and the resulting server/client code.

### build.includes

Default `[]`

A list of directories to be included in the server and client build. May not
be any known Primate location.

### build.index

Default `"index.js"`

Filename of the index JavaScript file used to export all components.

### build.transform.paths

Default `[]`

A list of paths for which the contents are to be transformed at runtime before
being copied to the [build directory][#location-build]. Relative paths will be
relative to project root. Glob patterns are supported.

### build.transform.mapper

Default `_ => _` (identity function)

A file content mapper for the files specified in `build.transform.files`.

## Type options

Configuring [runtime types](/guide/types).

### types.explicit

Default `false`

Whether Primate should autotype path parameters. If set to `true`, path
parameters and types having the exact same name won't be automatically typed.

## pages/app.html

If you use the `view` or `html` [handler](/guide/responses#view), Primate will
embed the generated HTML from the handler into this file. If an `app.html`
doesn't exist in the `pages` directory, Primate will fall back to its default
app page.

```html caption=dafault app page
<!doctype html>
<html>
  <head>
    <title>Primate app</title>
    <meta charset="utf-8" />
    %head%
  </head>
  <body>%body%</body>
</html>
```

If you create an `app.html` file inside the `pages` directory, Primate will
use it instead. When creating your own file, remember to include the `%head%`
and `%body%` placeholders.

## %head%

This placeholder is replaced by the JavaScript and CSS files Primate finds
inside the `static` directory. You don't need to explicitly include any of
those in the `<head>` and doing so might make your index file drift out of sync
with the [http.static.root](#http-static-root) setting.

## %body%

This placeholder is replaced by whatever HTML code the `view` or `html`
handler generates.

[hooks-load]: /guide/hooks#load
[default-app-html]: https://github.com/primatejs/primate/blob/master/packages/primate/src/defaults/app.html
[default-error-html]: https://github.com/primatejs/primate/blob/master/packages/primate/src/defaults/error.html
[rcompat]: https://github.com/rcompat/rcompat
