---
title: Primate 0.40: Store enums, YYY and ZZZ
epoch: 1782915308000
author: terrablue
---

Today we're announcing the availability of the Primate 0.40 preview release.

!!!
If you're new to Primate, we recommend reading the [quickstart] page to get
started.
!!!

## Store enums

In Primate 0.40, `p.enum` participates in stores. No more juggling a `p.u8`
column and a separate hand-rolled constants object that you hope stays in sync.
One declaration is fully validated, fully typed, and carries the enum names with
the schema.

```ts
// stores/Account.ts
import db from "#db";
import p from "pema";
import store from "primate/store";

const Status = p.enum({
  UNCONFIRMED: 0,
  CONFIRMED: 1,
});

export default store({
  table: "account",
  db,
  schema: {
    id: store.key.primary(p.u32),
    email: p.string,
    status: Status,
    created_at: p.date.default(() => new Date()),
  },
}).extend(_Account => ({
  Status,
}));
```

Then anywhere else in your app:

```ts
import Account from "#store/Account";

const account = await Account.insert({
  email: "john@example.com",
  status: Account.Status.UNCONFIRMED,
});

if (account.status === Account.Status.CONFIRMED) {
  // ...
}
```

This is worth getting excited about for a few reasons.

### Storage-portable

`p.enum` is backed by `p.u8` under the hood, so it stores as a plain integer
from 0 to 255. There are no dialect-specific enum types and no `CHECK`
constraints to babysit across SQLite, Postgres and MySQL — it rides on `u8`'s
existing column mapping.

### Rejects what `p.u8` can't

`p.u8` alone happily accepts `7` for a two-value enum. `p.enum` validates
membership too: only declared values pass.

### No drift between code and schema

The enum is the field, not a sibling constant you remember to update.
`Account.Status.CONFIRMED` is generated straight from the schema, not duplicated
by hand.

### Reverse lookup for free

`Account.Status.nameOf(account.status)` gets you `"CONFIRMED"` back when you
need the name, not just the number.

This is what we mean when we say Pema types should be database-aware, not just
request-validation types. The same declaration that validates your API input now
also defines how the value lives in your table — one source of truth, end to
end.

## YYY

TODO.

## ZZZ

TODO.

## Minor improvements

### Typed view responses

Routes can now declare the props shape they pass to `response.view` using
`responses.view`. The declared schema is exposed on route clients as
`route.method.View`, so views can derive their props from the route that renders
them without duplicating the type.

```ts
// routes/post.ts
import View from "#view/Post";
import p from "pema";
import response from "primate/response";
import route from "primate/route";

export default route({
  get: route.with({
    responses: {
      view: p({
        title: p.string,
        excerpt: p.string.optional(),
      }),
    },
  }, () => {
    return response.view(View, { title: "Hello Primate" });
  }),
});
```

```tsx
// views/Post.tsx
import type route from "#route/post";

export default function Post(props: typeof route.get.View) {
  return <h1>{props.title}</h1>;
}
```

The schema is also used to check the props passed to `response.view` in the
route handler. Optional Pema fields become optional TypeScript props, so a
schema like `p.string.optional()` allows the prop to be omitted entirely.

This works across the tier-one frontends: React, Svelte, Vue, Solid, Angular
and Marko.

### Autoapplying migrations

Primate 0.39, and now 0.40, supports autoapplying migrations in production. To
activate this, add `autoapply: true` to your configuration:

```ts
import config from "primate/config";
import db from "#db";

export default config({
  db: {
    migrations: {
      table: "migration",
      db,
      autoapply: true, // default is false
    },
  },
});
```

Migrations are then automatically applied when you run `node build/server.js` in
production. There's no need to run `npx primate migrate:apply` before running
the server.

This removes the need to rely on `node_modules` or a package manager in
production. You can copy the contents of `build` to your deployment server and
run your app with Node, Deno or Bun. If you're crossbuilding, consider also
setting `--target=node`, `--target=deno` or `--target=bun`; see
[Crossbuilding][crossbuilding] in the Primate 0.39 release notes.

## Breaking changes

TODO.

## Fin

If you like Primate, consider [joining our Discord server][discord] or starring
us on [GitHub].

[quickstart]: /docs/quickstart
[crossbuilding]: /blog/primate-039#crossbuilding
[discord]: https://discord.gg/RSg4NNwM4f
[GitHub]: https://github.com/primate-run/primate
