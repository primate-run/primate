---
title: Primate 0.37: Revised modules, XXX, YYY and ZZZ
epoch: 0
author: terrablue
---

Today we're announcing the availability of the Primate 0.37 preview release.
This release revises the module system, XXX, YYY, and ZZZ.

!!!
If you're new to Primate, we recommend reading the [Quickstart] page to get
started.
!!!

## Revised module system

Primate modules have always been the extension mechanism for the framework —
every official `@primate/*` package is itself a module. In 0.37 we've
simplified the API considerably.

Previously, a module was an abstract class. It is now a plain object (or a
factory function returning one) with two properties: a `name` string and a
`setup` function that receives the lifecycle hooks.

```ts
import type { Module } from "primate";

export default (): Module => ({
  name: "my-module",
  setup({ onBuild, onServe, onHandle }) {
    onServe(app => {
      console.log(`my-module active, secure: ${app.secure}`);
    });
  },
});
```

The five hooks — `onInit`, `onBuild`, `onServe`, `onHandle`, and `onRoute` —
are unchanged in what they do. Only the way you register them has changed:
instead of overriding methods on a class, you call the hook registrars passed
into `setup`.

State that used to live as class fields now lives as plain variables in the
factory function's closure, shared naturally across all hooks.

```ts
export default (): Module => {
  let secure = false;

  return {
    name: "my-module",
    setup({ onServe, onHandle }) {
      onServe(app => {
        secure = app.secure;
      });

      onHandle((request, next) => {
        return next(request.set("secure", secure));
      });
    },
  };
};
```

See the new [Modules] page in the docs for a full reference.

## `app:FRONTEND` and deprecation of magical request props

Until now, Primate injected a `request` prop into every component
automatically — a convenience that turned out to cause more confusion than it
solved, particularly around typing and tree-shaking.

In 0.37, each reactive frontend ships its own `app:FRONTEND` virtual module
that exposes the current request as a native reactive primitive. You opt in
explicitly, import only what you need, and get full type safety.

The primitive matches the frontend's own reactivity model:

**Svelte** — a writable store, subscribe with `$`:

```svelte
<script lang="ts">
  import { request } from "app:svelte";
</script>

<p>{$request.url.pathname}</p>
```

**React** — a hook backed by `useSyncExternalStore`:

```tsx
import { useRequest } from "app:react";

export default function Page() {
  const request = useRequest();
  return <p>{request.url.pathname}</p>;
}
```

**Vue** — a composable returning a `ref`:

```vue
<script lang="ts" setup>
  import { useRequest } from "app:vue";
  const request = useRequest();
</script>

<template><p>{{ request.url.pathname }}</p></template>
```

**Angular** — a signal assigned to a class property:

```ts
import { Component } from "@angular/core";
import { request } from "app:angular";

@Component({ template: `<p>{{ request().url.pathname }}</p>` })
export default class Page {
  request = request;
}
```

**Solid** — a signal called directly:

```tsx
import { request } from "app:solid";

export default function Page() {
  return <p>{request().url.pathname}</p>;
}
```

In all cases the value is a `RequestPublic` object — a lightweight snapshot of
the current request with `url`, `query`, `headers`, and `cookies` as plain
`Dict<string>` records. It updates automatically on every client-side
navigation.

The old magical `request` prop was removed in this release.

## Explicit, portable stores

Primate stores previously relied on runtime magic to fill in two pieces of
information: the store's `name` (derived from the filename) and its `db`
(inferred from the app's default database). This was convenient inside a
running Primate app, but it meant stores were not self-contained — importing
one outside of the framework context could silently fail or behave differently.

In 0.37, both `name` and `db` are required, and the `schema` field moves
inside the single options object:

```ts
// stores/Post.ts
import p from "pema";
import store from "primate/orm/store";
import key from "primate/orm/key";
import db from "../config/db/index.ts";

export default store({
  name: "post",
  db,
  schema: {
    id: key.primary(p.u32),
    title: p.string.max(100),
    body: p.string,
    created: p.date.default(() => new Date()),
  },
});
```

Passing an incorrect or missing `name`, `db`, or `schema` now throws
immediately at construction time.

The payoff is portability. A store file is now a plain module that works
anywhere — migration scripts, test suites, REPLs, or any other context outside
a running Primate app:

```ts
// scripts/migrate.ts
import Post from "../stores/Post.ts";

await Post.schema.create();
```

No framework initialisation required. See the updated [Stores] page for the
full reference.

### Migrating

Change the `store()` call in each of your store files from the old two-argument
form to the new single-object form, and add explicit `name` and `db` fields:

```ts
// before
export default store(
  { id: key.primary(p.u32), title: p.string },
  { db, name: "post" },
);

// after
export default store({
  name: "post",
  db,
  schema: { id: key.primary(p.u32), title: p.string },
});
```

## What's next

Check out our issue tracker for upcoming [0.38 features].

## Fin

If you like Primate, consider [joining our Discord server][discord] or starring
us on [GitHub].

[Quickstart]: /docs/quickstart
[Modules]: /docs/modules
[discord]: https://discord.gg/RSg4NNwM4f
[GitHub]: https://github.com/primate-run/primate
[0.38 features]: https://github.com/primate-run/primate/milestone/10
