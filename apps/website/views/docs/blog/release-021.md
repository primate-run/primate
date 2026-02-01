---
title: Release 0.21: More stores, error routes, liveview, `create primate`, and new website
epoch: 1690660448000
author: terrablue
---
Today we're announcing the availability of the Primate 0.21 preview release.
This release comes along with 3 new data stores (SQLite, PostgreSQL, MongoDB),
custom error routes, and a client liveview mode (SPA). On the tooling side,
we've also added a GUI for creating Primate apps, available via
`npm create primate`. With this release, we're also officially inaugurating our
new website.

!!!
If you're new to Primate, we recommend reading the [Getting started] page to
get an idea of the framework.
!!!

## New date stores

This release adds 3 new data store types, SQLite, PostgreSQL and MongoDB. In
addition, SurrealDB support has been moved from its own package into
`@primate/store`. All data store driver wrappers are now available as
`@primate/store` exports, where the user is responsible for installing the
underlying driver package.

For example, if you want to use the SQLite driver wrapper, you will need to
install `better-sqlite3`. Which package should be installed is documented in
the [driver section][drivers]. Primate will also direct you to install the
correct package should it be missing.

Using the new store drivers is similar to how all drivers work. You import and
pass them to the `driver` property of the `store` module.

```js caption=primate.config.js
import { sqlite, default as store } from "@primate/store";

export default {
  modules: [
    store({
      driver: sqlite({
        filename: "/tmp/data.db",
      }),
    }),
  ],
};
```

Individual driver options are documented in the [driver section][drivers].

!!!
The 3 new drivers are considered beta at this stage. In particular, the
PostgreSQL and MongoDB drivers do not support transaction rollbacks at the
moment.
!!!

## Custom error routes

The last releases have seen the addition of special `+guard.js` and `+layout.js`
files to achieve scoped, recursive route path guards and  layouts. This release
adds a new special `+error.js` file placed alongside route files. Those error
routes export, like guards and layouts, a default function which is executed in
case a normal route alongside it (or below it in the filesystem hierarchy)
encounters an error during execution.

Similarly to guards and layouts, the error route accepts a `request` parameter
and responds with a proper handler. Here is an example with an error route
file rendering a Svelte component.

```js caption=routes/+error.js
import view from "primate/handler/view";

export default request => view("ErrorPage.svelte");
```

Like guards and layouts, error files are recursively applied. For every route,
the **nearest** error file to it will apply. It will first look in its own
directory, and then start climbing up the filesystem hierarchy, falling back to
any `+error.js` file it finds along the way. Unlike guards and layouts, the
moment an `+error.js` file is found, it will be used to handle the response.

!!!
Quick recap on guards and layouts: all guards must be fulfilled for a route to
be executed, starting with the root guard and going down until the nearest
guard, if it exists. Layouts work in the opposite direction: they are
included in each other, with the innermost layout including the output of the
route, and being recursively included itself, up to the root layout. With error
routes, the first one to be found, from down to up, is applied.
!!!

The root error file located at `routes/+error.js`, if existing, has a special
meaning. It applies normally to every route for which no other error file can
be found, but it also applies in cases where no route at all could be matched.
It thus serves as a classic `404 Not Found` error route.

All error routes use the error page in `pages/error.html`. This file, like
`app.html`, can have placeholders for embedding head scripts and the body. In
case it does not exist, Primate will fall back to its default `error.html`.

```html caption=pages/error.html
<!doctype html>
<html>
  <head>
    <title>Error page</title>
    <meta charset="utf-8" />
    %head%
  </head>
  <body>
    <h1>Error page</h1>
    <p>
      %body%
    </p>
  </body>
</html>
```

Like normal routes, error routes can use a different error page if desired, by
passing a `page` property to the third handler parameter. The page file itself
must be located under `pages`.

```js caption=routes/+error.js
import view from "primate/handler/view";

export default request => view("ErrorPage.svelte", {}, {
  page: "other-error.html",
});
```

!!!
Error routes currently do **not** use layout files that would otherwise be
applicable to them in the filesystem hierarchy. This behavior may change in
the future.
!!!

## Client liveview (SPA)

Although Primate's frontend framework wrappers have all implemented SSR and
some (like Svelte) also hydration, there was until now a gap in achieving true
SPA (single-page application) functionality. This release bridges this gap by
adding a new module, `@primate/liveview`, that injects a small JavaScript client
into the build. This client uses `fetch` to manage clicking on links and
submitting forms instead of reloading the entire page, and also manages browsing
the history.

The liveview module uses a special `X-Primate-Liveview` header to indicate to
the handler that instead of rendering the entire HTML page, only the reference
to the next component and its data are required and should be returned as JSON.
Accordingly, every frontend handler must implement support for this header, and
currently the Svelte handler is the only one that does.

To activate liveview, import and load the module.

```js caption=primate.config.js
import svelte from "@primate/svelte";
import liveview from "@primate/liveview";

export default {
  modules: [
    svelte(),
    liveview(),
  ],
};
```

!!!
Liveview is equally relevant for `@primate/react` and `@primate/vue`, as well
as theoretically for the standard HTML handler, for rendering partial responses.
For the former two, we plan on supporting it as soon as we implement hydration.
For the latter, there is some conflict of interest with the `@primate/htmx`
module that merits further investigation into the utility of supporting
liveview for HTML.
!!!

## App creation GUI

On the tooling side, we have added a `create-primate` package which allows you
to generate new Primate apps using a GUI. To start it, run `npm create primate`
in your terminal.

This GUI will walk you through the process of creating a new Primate app,
allowing you to choose from the three common templates (web app, API, static
server) and asking you follow-up questions depending on the chosen template.
Most of the questions provide a link to the relevant section of the modules
documentation that explains the utility of adding certain functionalities.

In future releases, we plan to expand this tool in order to be able to quickly
scaffold apps by creating routes and other common files.

## New website

Over the last months we've put a lot of work into the new website. The old
website was built with MkDocs, and while writing documentation in Markdown files
has been serving us well and is something we wanted to keep, we believed we
needed something more modern and extensible in the underlying software. If
possible, we also wanted to use Primate itself for the website.

The result is [Priss][priss], a Primate + Svelte site generator that allows us
to use Svelte on the frontend and, if necessary, extend the site to include
dynamic features in the future. It also showcases Primate's potential to
address many different use cases.

The new website comes with an extensive guide covering the base framework as
well as a section on officially supported modules.

## Other changes

Consult the [full changelog][changelog] for a list of all relevant changes.

## Next on the road

This release has been unusually long in the making and had an extensive,
ambitious scope. Our next release, 0.22, is likely to be smaller, and we'll be
looking at building on the foundation laid forth by this release.

Things we plan to tackle in the upcoming weeks are,

* Add transactions to the PostgreSQL and MongoDB drivers
* Introduce IDE TypeScript support
* Add a `command` hook that would allow modules to register command line
  namespaces, to be able to run `npx primate [namespace] [command] [flags]`
* Use this new hook to create database migrations for SQL-flavored databases
* Extend `create-primate` with the ability to add new routes
* Extend `@primate/liveview` with support for WebSocket communication in case
  `@primate/ws` has been loaded
* Add hydration and liveview support for `@primate/react` and `@primate/vue`
* Support the `multipart/form-data` content type
* Introduce a `Result` class as an alternative return value for store functions
* Flesh out stores with default values, additional predicates and relations
  between tables/collections
* Add more type variants

This list isn't exhaustive or binding. None, some or all of these features may
be included in 0.22, and other features may be prioritized according to
feedback.

## Fin

If you like Primate, consider [joining our channel #primate][irc] on
irc.libera.chat.

Otherwise, have a blast with the new version!

[Getting started]: /guide/getting-started
[irc]: https://web.libera.chat#primate
[changelog]: https://github.com/primate-run/primate/releases/tag/0.21.2
[drivers]: /modules/drivers
[priss]: https://github.com/primate-run/priss
