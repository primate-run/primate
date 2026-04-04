---
title: App configuration
---

# Configuration

Primate works out of the box with zero configuration. In some cases, you may
wish to change the defaults. The most common use case is activating additional
modules.

Configuration files are located in `config`. Anything you configure is merged
into the defaults.

## `app.ts`
[s=configuration/app-ts]

`config/app.ts` exports the application facade for your app. For using that
value at runtime — including `app.config()`, `app.env()`, `app.view()`, and
`app.root` — see the [Application] page.

### App options

|Option|Default|Description|
|-|-|-|
|[db.migrations](#db-migrations)|`undefined`|database migration configuration|
|[http.csp](#http-csp)|`{}`|
|[http.headers](#http-headers)|`{}`|default HTTP response headers|
|[http.host](#http-host)|`"localhost"`|server host|
|[http.port](#http-port)|`6161`|server port|
|[http.ssl.cert](#http-ssl-cert)|`undefined`|path to SSL certificate|
|[http.ssl.key](#http-ssl-key)|`undefined`|path to SSL private key|
|[http.static.root](#http-static-root)|`"/"`|web path of static assets|
|[env.schema](#env-schema)|`undefined`|schema for typed environment variables|
|[modules](#modules)|`[]`|extension modules|
|[request.body.parse](#request-body-parse)|`true`|parse request body|

### `db.migrations`

Configuration for Primate's opt-in migration system.

```ts
import config from "primate/config";
import db from "#db";

export default config({
  db: {
    migrations: {
      table: "migration",
      db,
    },
  },
});
```

See the [Stores] page for the migration workflow.

### `http.csp`
The Content Security Policy (CSP) to use.

Example of a restrictive policy.

```js
{
// all content must come from own origin, excluding subdomains
"default-src": ["'self'"],
// styles must come from own origin, excluding subdomains
"style-src": ["'self'"],
// disallow <object>, <embed> and <applet> elements
"object-src": ["'none'"],
// disallow embedding
"frame-ancestors": ["'none'"],
// all form submissions must be to own origin
"form-action": ["'self'"],
// allow only own origin in <base>
"base-uri": ["'self'"],
}

```
### `http.headers`
HTTP headers to use when generating requests using the `view` handler.

### `http.host`
The HTTP host to use. This value is directly passed to the runtime.

### `http.port`
The HTTP port to use. This value is directly passed to the runtime.

### `http.ssl.cert`
Path to SSL certificate. If this property and `http.ssl.key` are set and
point to a valid key/certificate pair, Primate uses https instead of http.

### `http.ssl.key`
Path to SSL key. If `http.ssl.cert` and this property are set and point to a
valid key/certificate pair, Primate uses https instead of http.

### `http.static.root`
The path at which to serve static assets (those located in the `static`
directory). Static assets take precedence over routes. This option allows you
to have all static assets served at a subpath, like `/public`.

### `env.schema`
A Pema object schema used to validate and type environment variables exposed
through the application facade.

```ts
import config from "primate/config";
import p from "pema";

export default config({
  env: {
    schema: p({
      API_TOKEN: p.string,
      PORT: p.u16,
    }),
  },
});
```

With `env.schema` configured, `app.env(key)` validates values when the app
starts serving and becomes type-aware. See the [Application] page for usage.

### `modules`
Additional modules to load at runtime.

### `request.body.parse`
Whether the request body should be parsed according to the content type.
Turning this off is useful if you're using Primate as a programmable reverse
proxy and forwarding the requests to another app.

Even if this is turned off, headers, query string and cookies are still parsed
and available to `request`, and `request.original` then contains the untouched
original request.

### Reference
[s=configuration/app]

## `session.ts`

[s=configuration/session-ts]

### Session options

|Option|Default|Description|
|-|-|-|
|[cookie.httponly](#cookie-http-only)|`true`|mark cookie as `HttpOnly`|
|[cookie.name](#cookie-name)|`"session_id"`|name of the session cookie|
|[cookie.path](#cookie-path)|`"/"`|path for which the cookie is valid|
|[cookie.samesite](#cookie-samesite)|`"Lax"`|`SameSite` cookie policy|
|[manager](#manager)|`InMemorySessionManager`|the session manager class|

### `cookie.httpOnly`
Whether the session cookie should be set as and not be readable in JavaScript.

### `cookie.name`
The name of the session cookie.

### `cookie.path`
The session cookie path (paths on which the cookie is loaded).

### `cookie.sameSite`
The level of security to use in sending the session cookies when browsing
between websites.

### `manager`
The session cookie manager. By default, we use an in-memory session manager
that resets when the app restarts.

## `i18n.ts`

[s=configuration/i18n-ts]

### i18n options

|Option|Default|Description|
|-|-|-|
|[defaultLocale](#default-locale)|undefined|default locale|
|[locales](#locales)|[]|list of locales|
|[currency](#currency)|`"USD"`|active currency|
|[persist](#persist)|`"cookie"`|locale persistence mode|

### `defaultLocale`

The default locale to use, must be one from the `locales` list.

### `locales`

List of locales to use, must have at least one locale.

### `currency`

Currency to use in localization.

### `persist`

Locale persistance mode.

## `db/*.ts`

[s=configuration/db-ts]
[Application]: /docs/application
[Stores]: /docs/stores
