---
title: Release 0.31: new hot reload, projections and sorting in stores, new router
epoch: 1714841883000
author: terrablue
---
Today we're announcing the availability of the Primate 0.31 preview release.
This release switches to fast hot reload using esbuild, adds projections and
sorting to stores, and uses [rcompat]'s new router, adding support for optional
and rest path parameters.

!!!
If you're new to Primate, we recommend reading the [Getting started] page to
get an idea of it.
!!!

## Fast hot reload

Primate now uses esbuild as its built-in bundler via [rcompat]. This bundler
utilizes esbuild's fast hot reloading, replacing the previous mechanism which
used Node's file watching and was neither reliable nor fast.

## Support for projections / sorting in stores

Primate stores have gained additional capabilities in this release.

### Projections

It is now possible to add a projection to `Store#find` using a second parameter.

```js caption=routes/user-names.js
export default {
  get({ store: { User } }) {
    return User.find({}, ["name"]);
  },
};
```

This will show a JSON array of objects from the `user` collection with only the
`name` field.

### Sorting

It is now possible to influence the sorting order used in `Store#find` using a
third parameter.

```js caption=routes/user-names-sorted.js
export default {
  get({ store: { User } }) {
    return User.find({}, ["name"], { sort: { name: "asc" } });
  },
};
```

This will show a JSON array of objects from the `user` collection with only the
`name` field, sorted by `name` ascendingly.

## New filesystem router

This release now supports the whole breadth of type parameters similar to
Next or Svelte using [rcompat][rcompat]'s new filesystem router.

### Optional path parameters

Optional path parameters indicate a route which will be both matched with a
path parameter and without it.

Double brackets in route filenames, as in `user/[[action]].js`, are equivalent
to having two identical files, `user.js` and `user/[action].js`.

Optional parameters may only appear at the end of a route path and you can
combine them with runtime types, like non-optional path parameters.

### Rest path parameters

Rest path parameters are used to match subpaths at the end of a route path.

Brackets starting with three dots, as in `user/[...action_tree].js`, indicate a
rest parameter. Unlike normal parameters, rest parameters match `/` as well and
can be thus be used to construct subpaths. For example, in
`https://github.com/primate-run/primate/tree/master/docs/guide`, `docs/guide`
may be considered a subpath.

Rest parameters may only appear at the end of a route path. They may also be
optional, that is, matching with and without the parameter, by using two
brackets.

## Quality of life improvements

### HTMX integration improvements

#### Passing in props

The HTMX handler now supports passing in props, in JavaScript template string
style. Consider the following route.

```js caption=routes/htmx.js
import view from "primate/handler/view";

const posts = [{
  id: 1,
  title: "First post",
}];

export default {
  get() {
    return view("post-index.htmx", { posts });
  },
};
```

And the following HTMX component.

```html caption=components/post-index.htmx
<h1>All posts</h1>
${posts.map(post => `
  <h2>
    <a hx-get="/post/${post.id}" href="/post/${post.id}">
      ${post.title}
    </a>
  </h2>
`).join("")}
```

With that combination, a GET call to `/htmx` yields an HTMX-driven page with
the posts handed in from the route.

This prop support extends to Primate's built-in `html` handler in the same
fashion.

#### Partial rendering

Primate's `view` handler generally allows passing in `{ partial: true }` as part
of the third options parameter, which indicates the view component file to be
rendered should *not* be embedded within the default `app.html` but delivered in
bare form. This is great in case you use JavaScript to replace just a part of
the page.

When using HTMX's DOM manipulation verbs (e.g. `hx-get`, `hx-post`, etc.), HTMX
sends an `hx-request` header with the request. The `view` handler now, in the
case of HTMX, checks whether this handler was sent along the request, and in
such a case renders the component in partial mode.

### RequestFacade#pass

If you're using Primate as a reverse proxy, you may now use the `pass` function
on the request facade to pass a request wholesale to another backend.

You can do this generally in the `handle` hook.

```js caption=primate.config.js
export default {
  modules: {
    name: "proxy",
    handle(request, next) {
      // pass any requests whose path begins with /admin to another application
      // listening at port 6363
      if (request.url.pathname.beginsWith("admin")) {
        return request.pass("http://localhost:6363");
      }

      // continue execution in this app otherwise
      return next(request);
    },
  },
};
```

Or specifically within a given route.

```js caption=routes/pass.js
export default {
  get(request) {
    return request.pass("http://localhost:6363");
  },
};
```

This passes only GET requests to `/pass` to another application at port 6363.

Passing a request per route usually makes sense in combination with disabled
body parsing, which is now possible per route.

### Disabling body parsing per route

In 0.30, we added the option to [disable body parsing][disable-body-parsing]
for the entire application. This release adds the option to do so per route.

```js caption=routes/pass.js
export const body = {
  parse: false,
};

export default {
  get(request) {
    return request.pass("http://localhost:6363");
  },
};
```

A local route `body.parse` export overrides the application-wide setting. This
also means you could disable body parsing globally and then enable it for a
specific route.

## Migrating from 0.30

### remove @primate/build

Primate now comes bundled with esbuild; remove any use of the deprecated
`@primate/build` package; you also do not need to depend on `esbuild` yourself
anymore.

## Other changes

Consult the [full changelog][changelog] for a list of all relevant changes.

## Next on the road

Some of the things we plan to tackle in the upcoming weeks are,

* Multidriver transactions
* Add a `command` hook that would allow modules to register command line
  namespaces, to be able to run `npx primate [namespace] [command] [flags]`
* Use this new hook to create database migrations for SQL-flavored databases
* Add hydration and SPA support for `@primate/vue`
* Flesh out stores with default values, additional predicates and relations
  between tables/collections
* Add more type variants

This list isn't exhaustive or binding. None, some or all of these features may
be included in 0.32, and other features may be prioritized according to
feedback.

## Fin

If you like Primate, consider [joining our channel #primate][irc] on
irc.libera.chat.

Otherwise, have a blast with the new version!

[rcompat]: /blog/introducing-rcompat
[Getting started]: /guide/getting-started
[irc]: https://web.libera.chat#primate
[changelog]: https://github.com/primate-run/primate/releases/tag/0.31.0
[disable-body-parsing]: /blog/release-030#disabling-body-parsing
