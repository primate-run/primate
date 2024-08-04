Today we're announcing the availability of the Primate 0.32 preview release.
This release introduces support for building native applications with Primate
Native, adds two new frontends, Voby and Eta, and includes a host of other
changes.

!!!
If you're new to Primate, we recommend reading the [Getting started] page to
get an idea of it.
!!!

## Building native applications

Primate native allows you to package your existing project, as-is, into a
desktop application.

!!!
Compilation is currently only supported using Bun. In the future, as runtimes
mature their compilation capabilities, we will add support for Node and Deno.
!!!

### Install

`npm install @primate/native`

### Configure

Import and initialize the module in your configuration.

```js caption=primate.config.js
import native from "@primate/native";

export default {
  modules: [
    native(),
  ],
};
```

By default, when the application is launched, it will access `/` (the route
under `routes/index.js`. Change that by setting the `start` property during
configuration.

```js caption=primate.config.js
import native from "@primate/native";

export default {
  modules: [
    native({
      start: "/home",
    }),
  ],
};
```

### Compile

To compile your project, make sure you have Bun installed, and then run

`bun --bun x primate build desktop`

### Cross-compile

Choosing the `desktop` target will detect your current operating system and use
it as the compilation target. To cross-compile, specify the exact target.

`bun --bun x primate build linux-x64`

Currently available targets are `linux-x64`, `windows-x64`, `darwin-x64` and
`darwin-arm64`.

## New supported frontend: Voby

[Voby] is a high-performance framework with fine-grained observable-based
reactivity for building rich applications.

## Install

`npm install @primate/voby`

## Configure

Import and initialize the module in your configuration.

```js caption=primate.config.js
import voby from "@primate/voby";

export default {
  modules: [
    voby(),
  ],
};
```

## Use

Create a Voby component in `components`.

```html caption=components/PostIndex.voby
export default ({ posts, title }) => {
  return <>
    <h1>All posts</h1>
    {posts.map(({ id, title}) => <h2><a href={`/post/view/${id}`}>{title}</a></h2>)}
  </>;
}
```

Serve it from a route.

```js caption=routes/voby.js
import view from "primate/handler/view";

const posts = [{
  id: 1,
  title: "First post",
}];

export default {
  get() {
    return view("PostIndex.voby", { posts });
  },
};
```

The rendered component will be accessible at http://localhost:6161/voby.

## New supported frontend: Eta

[Eta] is a faster, more lightweight, and more configurable EJS alternative.

### Install

`npm install @primate/eta`

### Configure

Import and initialize the module in your configuration.

```js caption=primate.config.js
import eta from "@primate/eta";

export default {
  modules: [
    eta(),
  ],
};
```

Create an Eta component in `components`.

```html caption=components/post-index.eta
<h1>All posts</h1>
<div>
<% it.posts.forEach(function(post){ %>
<h2><a href="/post/view/<%= post.id %>"><%= post.title %></a></h2>
<% }) %>
</div>
```

Serve it from a route.

```js caption=routes/eta.js
import view from "primate/handler/view";

const posts = [{
  id: 1,
  title: "First post",
}];

export default {
  get() {
    return view("post-index.eta", { posts });
  },
};
```

The rendered component will be accessible at http://localhost:6161/eta.

## Quality of life improvements

## Migrating from 0.31

### HTML removed from core

The [HTML frontend] has been moved from core into its own package,
`@primate/html`. If you previously used HTML components, install
`@primate/html` and load it in your configuration.

### Normalized names for database configuration

All database drivers now use the same terminology to refer to the database to
use. Specifically, the JSON and SQLite drivers previously used the `filename`
property in their configuration to denote the location of the database file.
This is now `database`.

### Changed module imports

All backend, frontend and store modules now reside within their own packages.

```js caption=primate.config.js
// previously `import { typescript } from "@primate/binding";`
import typescript from "@primate/typescript";

// previously `import { svelte } from "@primate/frontend";`
import svelte from "@primate/svelte";

// previously `import { sqlite } from "@primate/store";`
import sqlite from "@primate/sqlite";
```

### Debarrelled imports for handlers

Primate handlers now use subpaths instead of named exports.

```js caption=routes/index.js
// previously `import { view } from "primate";`
import view from "@primate/handler/view";

export default {
  get() {
    return view("index.svelte");
  }
}
```

You can apply the following command in your routes directory to convert
all routes to the new format.

```sh
find . -type f -exec sed -i 's/import { view } from "primate"/import view from "primate\/handler\/view"/g' {} + &&
find . -type f -exec sed -i "s/import { view } from 'primate'/import view from 'primate\/handler\/view'/g" {} + &&
find . -type f -exec sed -i 's/import { error } from "primate"/import error from "primate\/handler\/error"/g' {} + &&
find . -type f -exec sed -i "s/import { error } from 'primate'/import error from 'primate\/handler\/error'/g" {} + &&
find . -type f -exec sed -i 's/import { redirect } from "primate"/import redirect from "primate\/handler\/redirect "/g' {} + &&
find . -type f -exec sed -i "s/import { redirect } from 'primate'/import redirect from 'primate\/handler\/redirect'/g" {} + &&
find . -type f -exec sed -i 's/import { ws } from "primate"/import ws from "primate\/handler\/ws"/g' {} + &&
find . -type f -exec sed -i "s/import { ws } from 'primate'/import ws from 'primate\/handler\/ws'/g" {} + &&
find . -type f -exec sed -i 's/import { sse } from "primate"/import sse from "primate\/handler\/sse"/g' {} + &&
find . -type f -exec sed -i "s/import { sse } from 'primate'/import sse from 'primate\/handler\/sse'/g" {} +
```

!!!
Note that this command won't convert combined imports of the form
import { view, redirect } from "primate";
!!!

### Changed i18n t and locale imports

The translation and locale imports of I18N are now imported directly from the
frontend package.

```js caption=components/index.svelte`
<script>
  // previously `import t from "@primate/i18n/svelte";`
  import t from "@primate/svelte/i18n";
  // previously `import { locale } from "@primate/i18n/svelte";`
  import locale from "@primate/svelte/locale";

  let count = 0;
</script>
<h3>{$t("Counter")}</h3>
<div>
<button on:click={() => { count = count - 1; }}>-</button>
<button on:click={() => { count = count + 1; }}>+</button>
{count}
</div>
<h3>{$t("Switch language")}</h3>
<div><a on:click={() => locale.set("en-US")}>{$t("English")}</a></div>
<div><a on:click={() => locale.set("de-DE")}>{$t("German")}</a></div>
```

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
be included in 0.33, and other features may be prioritized according to
feedback.

## Fin

If you like Primate, consider [joining our Discord server][discord].

Otherwise, have a blast with the new version!

[rcompat]: /blog/introducing-rcompat
[Getting started]: /guide/getting-started
[irc]: https://web.libera.chat#primate
[changelog]: https://github.com/primatejs/primate/releases/tag/0.32.0
[Eta]: https://eta.js.org
[Voby]: https://github.com/vobyjs/voby
[discord]: https://discord.gg/RSg4NNwM4f
[HTML frontend]: /modules/html
