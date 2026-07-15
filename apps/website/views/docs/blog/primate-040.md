---
title: Primate 0.40: Route pages, store enums, async schemas and events
epoch: 1783861841000
author: terrablue
---

Today we're announcing the availability of the Primate 0.40 preview release.

!!!
If you're new to Primate, we recommend reading the [quickstart] page to get
started.
!!!

## Collocated route pages

Primate 0.40 supports collocated route pages. Instead of importing a component
from `views` and passing it to `response.view`, a route can render the frontend
file next to it with `response.page`.

[s=blog/0.40/route-page/route]

The frontend file has the same basename as the route, only a different
extension.

[s=blog/0.40/route-page/component]

The route handles data loading, validation, redirects and status codes; the page
handles rendering.

### Typed props without declarations

The component examples above use `typeof route.get.Page` for their props. That
type comes from `response.page(...)`, so the route response is the source of
truth and there's no separate interface to keep in sync.

### Layout pages

Layouts can be collocated too.

[s=blog/0.40/layout-page/route]

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

This removes a few common sources of drift.

### Plain storage

`p.enum` is backed by `p.u8` under the hood, so it stores as a plain integer
from 0 to 255. There are no dialect-specific enum types and no `CHECK`
constraints to babysit across SQLite, Postgres and MySQL — it rides on `u8`'s
existing column mapping.

### Membership validation

`p.u8` alone happily accepts `7` for a two-value enum. `p.enum` validates
membership too: only declared values pass.

### One declared value

The enum is the field, not a sibling constant you remember to update.
`Account.Status.CONFIRMED` is generated straight from the schema, not duplicated
by hand.

### Reverse lookup

`Account.Status.nameOf(account.status)` gets you `"CONFIRMED"` back when you
need the name, not just the number.

## Derived and async schemas

Pema schemas can now derive a parsed value into a different value. Use
`.derive(...)` when parsed input should be normalized before the handler sees it.

```ts
import p from "pema";

const FullName = p({
  first: p.string,
  last: p.string,
}).derive(({ first, last }) => `${first} ${last}`);

const name = FullName.parse({ first: "John", last: "Adams" });
// name is "John Adams"
```

This works anywhere a Pema schema is accepted. For request bodies, the derived
type flows into the route handler.

```ts
import p from "pema";
import route from "primate/route";

const Body = p({
  name: p.string,
}).derive(({ name }) => name.toUpperCase());

export default route({
  post: route.with(
    { body: Body, contentType: "application/json" },
    async request => {
      const name = await request.body.json();
      // name is string
      return name;
    },
  ),
});
```

Primate 0.40 also supports `p.async(...)` for object schemas that need async
post-processing. Its `parse(...)` method always returns a promise, and async
derives compose just like sync derives.

```ts
import p from "pema";

const User = p.async({
  id: p.string,
}).derive(async ({ id }) => {
  return await loadUser(id);
});
```

Async schemas are supported in `route.with(...)` for bodies and path parameters.
For path schemas, `p.async(...)` keeps the object shape visible so Primate can
still check that route parameters and schema properties match at build time.

```ts
// routes/user/[id].ts
import p from "pema";
import route from "primate/route";

const Path = p.async({
  id: p.string,
}).derive(async ({ id }) => ({
  id: await resolveUserId(id),
}));

export default route({
  get: route.with({ path: Path }, request => {
    return request.path.get("id");
  }),
});
```

Use regular `.derive(...)` for synchronous transformations. Reach for
`p.async(...)` when the schema has to await I/O, lookup data, or perform another
async normalization step before the handler sees the value.

## Events and simpler SSE cleanup

`response.sse` now uses a single setup function instead of separate `open` and
`close` callbacks. Return a cleanup function to stop timers or unsubscribe when
the browser disconnects.

```ts
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.sse(source => {
      const timer = setInterval(() => {
        source.send("tick", Date.now());
      }, 1000);

      return () => clearInterval(timer);
    });
  },
});
```

Primate 0.40 also includes `primate/events`, an in-memory channel helper for
keyed subscriptions.

```ts
// services/DeploymentEvents.ts
import events from "primate/events";

type DeploymentEvent = {
  type: "step";
  key: number;
  status: "running" | "done" | "error";
};

export default events.channel<number, DeploymentEvent>();
```

Emit with a key, subscribe with the same key, and return the unsubscribe function
from `response.sse`.

```ts
return response.sse(source => {
  return DeploymentEvents.subscribe(deployment.id, event => {
    source.send(event.type, event);
  });
});
```

Channels are intentionally local to one server process. They do not persist
events or broadcast across multiple running instances.

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

Primate can now autoapply migrations in production. To activate this, add
`autoapply: true` to your configuration:

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

## Fin

If you like Primate, consider [joining our Discord server][discord] or starring
us on [GitHub].

[quickstart]: /docs/quickstart
[crossbuilding]: /blog/primate-039#crossbuilding
[discord]: https://discord.gg/RSg4NNwM4f
[GitHub]: https://github.com/primate-run/primate
