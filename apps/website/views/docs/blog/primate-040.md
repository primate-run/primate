---
title: Primate 0.40: Collocated route pages, store enums and ZZZ
epoch: 1782915308000
author: terrablue
published: false
---

Today we're announcing the availability of the Primate 0.40 preview release.

!!!
If you're new to Primate, we recommend reading the [quickstart] page to get
started.
!!!

## Collocated route pages

Primate 0.40 adds collocated route pages. Instead of importing a component from
`views` and passing it to `response.view`, a route can render the frontend file
next to it with `response.page`.

[s=blog/0.40/route-page/route]

The frontend file has the same basename as the route, only a different
extension.

[s=blog/0.40/route-page/component]

The route stays responsible for data loading, validation, redirects and status
codes; the page stays responsible for rendering.

### Typed props without declarations

The component examples above use `typeof route.get.Page` for their props. That
type comes from `response.page(...)`, so the route response is the source of
truth and there's no separate interface to keep in sync.

### Layout pages

Layouts can be collocated too.

```ts
// routes/admin/+layout.ts
export default route({
  get() {
    return response.page({ section: "Admin" });
  },
});
```

As with normal routes, add a component alongside the layout with the same
basename.

[s=blog/0.40/layout-page/component]

The matching layout page receives those props plus its children. This keeps
route-specific UI close to the route while preserving the existing `views`
directory for shared components and explicitly named views.

## Store enums

In Primate 0.40, `p.enum` participates in stores. No more juggling a `p.u8`
column and a separate hand-rolled constants object that you hope stays in sync.
One declaration is fully validated, fully typed, and carries the enum names with
the schema.

```ts
// stores/Account.ts
import db from "@/config/db";
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
import Account from "@/stores/Account";

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

## ZZZ

TODO.

## Minor improvements

### App imports move to `@/`

New Primate apps now use a single `@/*` TypeScript path alias for application
imports instead of the previous family of `#` aliases. This avoids collisions
with package-internal import maps and makes app imports read like regular
project-root imports.

```json
{
  "compilerOptions": {
    "baseUrl": "${configDir}",
    "paths": {
      "@/*": ["*"]
    }
  }
}
```

Existing imports map directly to their project folders:

```ts
import app from "@/config/app";
import db from "@/config/db";
import View from "@/views/Post";
import route from "@/routes/post";
import User from "@/stores/User";
```

This replaces app-level imports like `#app`, `#db`, `#lib/*`, `#view/*`,
`#route/*`, and `#store/*`.

### HTML templates move to `templates`

Primate's HTML shell files now live in `templates` instead of `pages`. This
frees up the term "page" for collocated route pages while making the existing
concept clearer: these files are document templates, not route pages.

```txt
templates/app.html
templates/error.html
```

The render option has been renamed in the same spirit:

```ts
return response.view(View, props, { template: "admin.html" });
return response.error({ template: "error.html" });
```

New apps generated with `npx primate init` use `templates/app.html`, and the
old `pages` directory is no longer part of the app structure.

### Autoapplying migrations

Primate 0.39, and now 0.40, supports autoapplying migrations in production. To
activate this, add `autoapply: true` to your configuration:

```ts
import config from "primate/config";
import db from "@/config/db";

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
