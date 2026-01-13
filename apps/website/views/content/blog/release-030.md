---
title: Release 0.30: Windows support, new path parameter style and other improvements
epoch: 1708854056000
author: terrablue
---
Today we're announcing the availability of the Primate 0.30 preview release.
This release introduces full Windows support and brings the path parameter
style used by Primate's filesystem-based routes in line with other frameworks,
in addition to several quality of life improvements.

!!!
If you're new to Primate, we recommend reading the [Getting started] page to
get an idea of it.
!!!

## Windows support

This release introduces full support for running Primate on Windows, including
Wasm routes, data stores as well as frontends.

## New path parameter style

In this release, Primate is switching from its original path parameter style,
using braces, to brackets.

If you had a path like `routes/user/{id}.js` before, you would now be using
`routes/user/[id].js` in line with most other filesystem-based frameworks.

To illustrate, here are a few examples of paths in 0.30.

* `index.js` is mapped to the root route (`/`)
* `user.js` is mapped to `/user`
* `user/[user_id].js` is mapped to a route with parameters, for example
`/user/1` (but also `/user/donald`)
* `user/[user_id=uuid].js` is mapped to a route where `user_id` is of the type
`uuid`, for example `/user/f6a3fac2-7c1d-432d-9e1c-68d0db925adc` (but not
`/user/1`)

## Quality of life improvements

### Default loose mode in stores

The default mode for `@primate/store` stores is now `loose`. This is similar to
before with the addition that fields not explicitly declared in the store
definition will be also saved. This is particulary useful for NoSQL databases
that do not have a rigid schema, in cases where you want to enforce types on
some fields and accept anything in others.

To make this applicable for SQL databases too, we will add a `catchall` type in
the future denoting a JSON column in which the data of any non-declared fields
is saved and properly deserialized when retrieved.

To enforce strictness in stores globally, pass in `{ mode: "strict" }` when
activating the store module. To enforce strictness on store level, use
`export const mode = "strict";` in the store file. To opt out of global
strictness per store, use `export const mode = "loose";`.

In the future, we will add the ability to mark fields as optional such that
it's possible to enforce a strict mode with explicit exceptions for optional
(nullable) fields.

### Loose default CSP

Previously, Primate enforced a strict CSP policy. In this release, the defaults
have been changed to no CSP policy. If you create a policy directive for
`script-src` or `style-src`, Primate will augment it with hashes for scripts
and stylesheets.

### Improved error handling of route return object

Starting with this release, Primate will tell you if you forget to return data
from your route or the body you return is invalid.

```sh
!! primate invalid body returned from route, got `undefined`
++ return a proper body from route
   -> https://primate.run/guide/logging#invalid-body-returned
```

### Disabling body parsing

You can now tell Primate to not parse the body stream of the request, leaving
it pristine, by setting `request.body.parse` to `false` in your configuration
file.

```js caption=primate.config.js
export default {
  request: {
    body: {
      parse: false,
    },
  },
};
```

This is particularly useful if you're using Primate as a programmable reverse
proxy with the `handle` hook and you want to pass the untouched request to
another application.

```js caption=primate.config.js
const upstream = "http://localhost:7171";

export default {
  request: {
    body: {
      parse: false,
    },
  },
  modules: [{
    name: "reverse-proxy",
    handle(request) {
      const { method, headers, body } = request.original;
      const input = `${upstream}${request.url.pathname}`;

      return globalThis.fetch(input, { headers, method, body, duplex: "half" });
    },
  }],
};
```

## Migrating from 0.29

### update path parameters to new style

Change any `{` to `[` and `}` to `]` in your path parameters.

The following script will change any JavaScript route files you have in your
`routes` directory from the old to the new style.

```sh
find -name "*.js" -exec rename -v "{" "[" {} ";" &&
find -name "*.js" -exec rename -v "}" "]" {} ";"
```

If you used path parameters in any directory names, change them manually.

### CSP policy

If you previously needed to add a CSP policy due to Primate's restrictive
defaults, you probably don't need to do that anymore in 0.30. Remove `http.csp`
from `primate.config.js`.

If you do need a CSP policy, note that you now have to denote individual
properties as arrays.

```js caption=primate.config.js
export default {
  http: {
    csp: {
      "script-src": ["'self'"],
    },
  },
};
```

Primate will add its own script and style hashes to the policy.

## Other changes

Consult the [full changelog][changelog] for a list of all relevant changes.

## Next on the road

Some of the things we plan to tackle in the upcoming weeks are,

* Add projections and relations to stores
* Multidriver transactions
* Add a `command` hook that would allow modules to register command line
  namespaces, to be able to run `npx primate [namespace] [command] [flags]`
* Use this new hook to create database migrations for SQL-flavored databases
* Add hydration and SPA support for `@primate/vue`
* Flesh out stores with default values, additional predicates and relations
  between tables/collections
* Add more type variants

This list isn't exhaustive or binding. None, some or all of these features may
be included in 0.31, and other features may be prioritized according to
feedback.

## Fin

If you like Primate, consider [joining our channel #primate][irc] on
irc.libera.chat.

Otherwise, have a blast with the new version!

[Getting started]: /guide/getting-started
[irc]: https://web.libera.chat#primate
[changelog]: https://github.com/primate-run/primate/releases/tag/0.30.0
