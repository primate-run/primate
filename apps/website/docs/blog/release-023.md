---
title: Release 0.23: Handlebars support, transactions, bundler code splitting
epoch: 1694873522000
author: terrablue
---
Today we're announcing the availability of the Primate 0.23 preview release.
This release comes along with a new frontend handler, Handlebars, transactions
across most of our database drivers, bundler code splitting, as well as several
quality of life improvements.

!!!
If you're new to Primate, we recommend reading the [Getting started] page to
get an idea of the framework.
!!!

## Supporting Handlebars

This release adds support for a Handlebars frontend handler, including
precompiling.

The Handlebars handler works like all other frontend handlers. To activate it,
install and load the module in your configuration.

```js caption=primate.config.js
import handlebars from "@primate/handlebars";

export default {
  modules: [
    handlebars(),
  ],
};
```

Then place a Handlebars file in your `components` directory.

```hbs caption=components/post-index.hbs
<h1>All posts</h1>
<div>
{{#each posts}}
<h2><a href="hbs/post/view/{{this.id}}">{{this.title}}</a></h2>
{{/each}}
</div>
```

Lastly, serve your Handlebars component from a route of your choice.

```js caption=routes/index.js
import view from "primate/handler/view";

const posts = [{
  id: 1,
  title: "First post",
}];

export default {
  get() {
    return view("post-index.hbs", { posts });
  },
};
```

If you then run Primate, your Handlebars component should be served at `GET /`
as HTML.

## Transactions across the board

With the exception of SurrealDB, all supported database drivers now support
transactions within routes. You don't need to explictly start a transaction or
commit it in the end; the store module does that for you automatically. If at
any point during the route execution an error occurs, the transaction will be
rolled back and no changes will be committed to the data store.

Consider the following store.

```js caption=stores/User.js
import primary from "@primate/schema/primary";
import string from "@primate/schema/string";
import u8 from "@primate/schema/u8";
import email from "@primate/schema/email";
import date from "@primate/schema/date";

export default {
  id: primary,
  name: string,
  age: u8,
  email,
  created: date,
};
```

The following route will try to insert a new User record into the database, but
with an `age` value that is larger than 2^8-1. Validation will fail, and the
record won't be inserted.

```js caption=routes/index.js
import view from "primate/handler/view";

export default {
  get(request) {
    const { User } = request.store;

    // count before
    const before = await User.count();

    // this works, as `age` is smaller than 255
    // user will contain a generated id and { age: 120 }
    const user = await User.insert({
      age: 120,
    });

    // after + 1 === before
    const after = await User.count();

    // at this stage, a new user has been inserted as part of this transaction
    // it's visible within this route, but not commited yet

    // u8 can only contain 0-255, validation will fail, throwing an error
    // as this is not handled explicitly here, the transaction will be rolled
    // back and the client redirected to an error page
    await User.insert({
      age: 256,
    });

    // the previous insert failed validation, this line will never be reached
    return "user saved!";
  },
};
```

## Bundler code splitting

The esbuild bundler used in `@primate/esbuild` now automatically supports code
splitting. If you have a frontend component that dynamically imports another
JavaScript file, esbuild will extract the dynamic import and fetch the
file during runtime once the code path is encountered. This is similar to the
behavior you would see without a bundler, where all files are kept separately.

## Quality of life improvements

This release features several quality of life improvements.

### Hoisted frontend props

Previously, all props passed from a route to its frontend component were
available under the `data` prop within the component. As of this release, the
props are made available directly to the frontend component.

Consider this Svelte route.

```js caption=routes/svelte.js
import view from "primate/handler/view";

const posts = [{
  id: 1,
  title: "First post",
}];

export default {
  get() {
    return view("PostIndex.svelte", {posts});
  },
};
```

Previously `posts` was a subproperty of the `data` prop.

```svelte caption=components/PostIndex.svelte
<script>
  export let data;
</script>
<h1>All posts</h1>
{#each data.posts as {id, title}}
<h2><a href="/svelte/post/{id}">{title}</a></h2>
{/each}
```

Now, `posts` is directly exportable in the Svelte component.

```svelte caption=components/PostIndex.svelte
<script>
  export let posts;
</script>
<h1>All posts</h1>
{#each posts as {id, title}}
<h2><a href="/svelte/post/{id}">{title}</a></h2>
{/each}
```

This change applies to all frontend handlers.

## Other changes

Consult the [full changelog][changelog] for a list of all relevant changes.

## Next on the road

Some of the things we plan to tackle in the upcoming weeks are,

* Add projections and relations to stores
* Multidriver transactions
* Introduce IDE TypeScript support
* Add a `command` hook that would allow modules to register command line
  namespaces, to be able to run `npx primate [namespace] [command] [flags]`
* Use this new hook to create database migrations for SQL-flavored databases
* Extend `create-primate` with the ability to add new routes
* Add hydration and liveview support for `@primate/vue`
* Support the `multipart/form-data` content type
* Introduce a `Result` class as an alternative return value for store functions
* Flesh out stores with default values, additional predicates and relations
  between tables/collections
* Add more type variants

This list isn't exhaustive or binding. None, some or all of these features may
be included in 0.24, and other features may be prioritized according to
feedback.

## Fin

If you like Primate, consider [joining our channel #primate][irc] on
irc.libera.chat.

Otherwise, have a blast with the new version!

[Getting started]: /guide/getting-started
[irc]: https://web.libera.chat#primate
[changelog]: https://github.com/primate-run/primate/releases/tag/0.23.0
