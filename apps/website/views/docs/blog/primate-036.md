---
title: Primate 0.36: ORM relations, hooks, form validation, backend i18n
epoch: 1771192146000
author: terrablue
---

Today we're announcing the availability of the Primate 0.36 preview release.
This release introduces ORM relations across all drivers, app hooks
(middleware), support for validated forms, as well as backend i18n support.

!!!
If you're new to Primate, we recommend reading the [Quickstart] page to get
started.
!!!

## ORM relations

Primate now supports defining and querying relations between stores across all
database drivers (SQLite, PostgreSQL, MySQL, MongoDB).

### key.{primary,foreign}

Primary and foreign keys are now defined explicitly using the `orm/key` export:

```ts
import key from "primate/orm/key";
import p from "pema";

const User = new Store({
  id: key.primary(p.string),
  name: p.string,
});

const Article = new Store({
  id: key.primary(p.u32),
  title: p.string,
  author_id: key.foreign(User),
});
```

Primary keys support `string`, integer (`u8`, `u16`, `u32`, `i8`, `i16`, `i32`),
and bigint (`u64`, `u128`, `i64`, `i128`) types. By default, primary keys are
auto-generated — use `key.primary(type, { generate: false })` to require
explicit values.

### relation.{one,many}

Define relations using the `orm/relation` export:

```ts
import relation from "primate/orm/relation";
import store from "primate/orm/store";

const User = store({
  id: key.primary(p.string),
  name: p.string,
}, {
  relations: {
    articles: relation.many(Article, "author_id"),
    profile: relation.one(Profile, "user_id"),
  },
});
```

`relation.many` defines a one-to-many relationship (user has many articles),
while `relation.one` defines a one-to-one relationship.

### reverse

For reverse relations (querying from the *many* side back to the *one* side):

```ts
import store from "primate/orm/store";

const Article = store({
  id: key.primary(p.u32),
  title: p.string,
  author_id: key.foreign(User),
}, {
  relations: {
    author: relation.one(User, "author_id", { reverse: true }),
  },
});
```

### with

Load relations using the `with` option in queries:

```ts
const users = await User.find({
  where: { name: "John" },
  with: {
    articles: {
      select: ["title"],
      sort: { title: "asc" },
      limit: 5,
    },
  },
});
```

Each relation can specify its own `select`, `sort`, `where`, and `limit`
options. Use `true` to load a relation with defaults:

```ts
const users = await User.find({
  where: { name: "John" },
  with: { articles: true, profile: true },
});
```

For SQL drivers, simple single-relation queries use efficient JOINs,
while complex queries use a phased approach with optimized subqueries.

## Query operators

Primate now supports a comprehensive set of query operators across all drivers:

### Comparison operators

```ts
// greater than / less than
await User.find({ where: { age: { $gt: 18 } } });
await User.find({ where: { age: { $gte: 18 } } });
await User.find({ where: { age: { $lt: 65 } } });
await User.find({ where: { age: { $lte: 65 } } });

// not equal
await User.find({ where: { status: { $ne: "inactive" } } });

// combine operators on same field
await User.find({ where: { age: { $gte: 18, $lte: 65, $ne: 30 } } });
```

### Date/time operators

```ts
// after / before for datetime fields
await Event.find({ where: { starts_at: { $after: new Date("2025-01-01") } } });
await Event.find({ where: { ends_at: { $before: new Date("2025-12-31") } } });
```

### Pattern matching

```ts
// case-sensitive LIKE (SQL wildcards: % for any chars, _ for single char)
await User.find({ where: { name: { $like: "John%" } } });

// case-insensitive LIKE
await User.find({ where: { email: { $ilike: "%@gmail.com" } } });

// escape literal % or _ with backslash
await Task.find({ where: { name: { $like: "100\\% complete" } } });
```

## Hooks

Primate now uses `+hook.ts` files for request middleware, replacing the previous
`+guard.ts` approach. Hooks provide a more flexible middleware pattern with
explicit control over request flow and context propagation.

### `hook.ts` files

Create a `+hook.ts` file in any route directory to intercept requests using the
`route/hook` export:

```ts
￼// routes/admin/+hook.ts
import hook from "primate/route/hook";

hook((request, next) => {
  if (request.query.try("password") === "opensesame") {
    return next(request);
  }
  return "wrong";
});
```

Hooks receive the request and a `next` function. Call `next(request)` to
continue to the route handler, or return a response directly to short-circuit.

### Context propagation

Hooks can pass data to downstream handlers using `request.set()`:

```ts
// routes/+hook.ts
import hook from "primate/route/hook";

hook((request, next) => next(request.set("user", { id: 1, name: "John" })));
```

Access the data in nested hooks or route handlers:

```ts
// routes/dashboard/+hook.ts
import hook from "primate/route/hook";

hook((request, next) => {
  const user = request.get<{ id: number; name: string }>("user");
  return next(request.set("greeting", `Hello, ${user.name}`));
});
```

```ts
// routes/dashboard/index.ts
import route from "primate/route";

route.get(request => {
  const greeting = request.get<string>("greeting");
  return { greeting };
});
```

Hooks execute from outermost to innermost directory, allowing layered
middleware patterns like authentication → authorization → request enrichment.

The `request.set()` method also accepts a function for updating existing values:

```ts
hook((request, next) => next(request.set<string>("foo", prev => prev + "bar")));
```

## Validated forms

Primate now includes a unified form handling API across all frontend adapters.
The `client` module provides `form()` and `field()` helpers that handle
submission, validation errors, and loading states.

### Basic usage

Import `client` from your frontend adapter and create a form:

```tsx
// React
import client from "@primate/react/client";

export default function Form(props: { counter: number; id: string }) {
  const form = client.form({ initial: { counter: props.counter } });

  return (
    <form
      method="post"
      action={`/form?id=${props.id}`}
      id={form.id}
      onSubmit={form.submit}
    >
      {form.errors.length > 0 && (
        <p style={{ color: "red" }}>{form.errors[0]}</p>
      )}

      <label>
        Counter:
        <input
          type="number"
          name={form.field("counter").name}
          defaultValue={form.field("counter").value}
        />
      </label>

      {form.field("counter").error && (
        <p style={{ color: "red"}}>{form.field("counter").error}</p>
      )}

      <button type="submit" disabled={form.submitting}>Save</button>
    </form>
  );
}
```

### Backend validation

The form automatically parses validation errors from Pema's `ParseError`:

```ts
// routes/form.ts
import route from "primate/route";
import p from "pema";

route.post(async request => {
  const FormSchema = p({ counter: p.number.coerce });
  const validated = request.body.form(FormSchema);

  await Counter.update({
    where: { id: request.query.get("id") },
    set: { counter: validated.counter },
  });

  return null;
});
```

If validation fails, errors are automatically displayed on the corresponding
fields.

### Form API

| Property | Type | Description |
|----------|------|-------------|
| `form.id` | `string` | Unique form ID |
| `form.submitting` | `boolean` | True while form is submitting |
| `form.submit` | `(event?) => Promise` | Submit handler |
| `form.errors` | `string[]` | Form-level errors |
| `form.field(name)` | `Field` | Get field by name |

### Field API

| Property | Type | Description |
|----------|------|-------------|
| `field.name` | `string` | Field name for input |
| `field.value` | `T` | Initial field value |
| `field.error` | `string \| null` | First error or null |
| `field.errors` | `string[]` | All errors for field |

### Frontend support

The form API works across all Primate frontends with idiomatic patterns:

| Frontend | Import | Notes |
|----------|--------|-------|
| React | `@primate/react/client` | Uses hooks internally |
| Svelte | `@primate/svelte/client` | Returns a store (`$form`) |
| Vue | `@primate/vue/client` | Uses Vue refs |
| Solid | `@primate/solid/client` | Uses signals |
| Angular | `@primate/angular/client` | Uses Angular signals |

This is initial support for validated forms — more features like client-side
Pema schema validation are planned for future releases.

## Backend i18n

The `i18n` module now works in route handlers, not just frontend components.
When a user's locale is set (via cookie), you can use the same `t()` function
in your backend code.

```ts
// config/i18n.ts
import i18n from "primate/i18n";
import locale from "primate/i18n/locale";

export default i18n({
  defaultLocale: "en",
  locales: {
    en: locale({ greeting: "Hello, {name}!" }),
    de: locale({ greeting: "Hallo, {name}!" }),
  },
});
```

```ts
// routes/greet.ts
import t from "#i18n";
import route from "primate/route";

route.get(() => {
  return { message: t("greeting", { name: "World" }) };
});
```

The locale is automatically resolved from the user's cookie. A French user
visiting `/greet` will receive `{ message: "Bonjour, World!" }` (assuming you
have a French locale configured).

This enables:
- **Localized API responses** — return translated error messages, labels, etc.
- **Server-rendered content** — generate locale-aware HTML without client JS
- **Email templates** — use `t()` when building notification emails

The same formatting specifiers work on the backend: `{count:n}` for numbers,
`{date:d}` for dates, `{amount:c}` for currency, and plural forms like
`{count:n|one item|{count} items}`.

## App facade

Routes can now import an app facade directly via `#app`, giving access to
app-level utilities without needing to return a function from route handlers.

```ts
// routes/index.ts
import app from "#app"; // via tsconfig, or relative import to config/app.ts
import response from "primate/response";
import route from "primate/route";

route.get(async () => {
  const guides = await app.root.join("guides.json").json();
  const { html } = app.view("docs/home/index.md");

  return response.view(Index, { guides, content: html });
});
```

### Available properties

| Property | Description |
|----------|-------------|
| `app.root` | Project root directory (`FileRef`) |
| `app.view(name)` | Load a server-side view by name |
| `app.config(path)` | Access config values by path |

This simplifies routes that need app-level access — no more wrapping your
return value in `app => { ... }`:

```ts
// before
route.get(request => {
  return async app => {
    const { html } = app.loadView("docs/index.md");
    return response.view(Page, { content: html })(app, {}, request);
  };
});

// after
route.get(() => {
  const { html } = app.view("docs/index.md");
  return response.view(Page, { content: html });
});
```

## Breaking changes

### `primate/store` -> `primate/orm/store`

Change all `primate/store` imports to `primate/orm/store`.

### `p.primary` -> `key.primary(...)`

Change all `p.primary`, where `p` is the default pema export, to `key.primary`,
where `key` is the default export from `primate/orm/key`. You now need to
explicitly specify the data type of the primary key column.

### ORM signatures changed

Store method signatures have been unified:

```ts
// before
await User.get(id);
await User.try(id);
await User.has(id);
await User.find(criteria, options);
await User.count(criteria);
await User.update(criteria, changeset);
await User.delete(criteria);

// after
await User.get(pk);
await User.get(pk, { select: ["name"], with: { articles: true } });
await User.try(pk);
await User.try(pk, { select: ["name"], with: { profile: true } });
await User.has(pk);
await User.find({ where: { active: true }, select: ["name"], limit: 10 });
await User.count({ where: { status: "active" } });
await User.update({ where: { id: 1 }, set: { name: "Jane" } });
await User.delete({ where: { id: 1 } });
```

The `update` and `delete` methods now take a single object with explicit `where`
and `set` keys, replacing the previous positional `criteria`/`changeset`
arguments.

All query methods now take a single options object. The `find` method combines
criteria and options into one object with explicit `where`, `select`, `sort`,
`limit`, and `with` keys.

### ORM select is now `string[]` instead of `Record<string, true>`

Field selection now uses a simple array:

```ts
// before
await User.find({ where: {}, select: { name: true, age: true } });

// after
await User.find({ where: {}, select: ["name", "age"] });
```

### `+guard.ts` -> `+hook.ts`

Guard files have been replaced with hook files. Rename all `+guard.ts` files to
`+hook.ts` and update the implementation:

```ts
// before (+guard.ts)
import route from "primate/route";

route.get(request => {
  if (request.query.try("password") === "opensesame") {
    return null;  // pass through
  }
  return "wrong";
});

// after (+hook.ts)
import hook from "primate/route/hook";

hook((request, next) => {
  if (request.query.try("password") === "opensesame") {
    return next(request);  // pass through
  }
  return "wrong";
});
```

Key differences:

* Import hook from `primate/route/hook` instead of using `route.get`
* Return `next(request)` to continue instead of returning `null`
* Hooks can modify the request via `request.set()` before passing it downstream


## What's next

Check out our issue tracker for upcoming [0.37 features].

## Fin

If you like Primate, consider [joining our Discord server][discord] or starring
us on [GitHub].

[Quickstart]: /docs/quickstart
[discord]: https://discord.gg/RSg4NNwM4f
[GitHub]: https://github.com/primate-run/primate
[0.37 features]: https://github.com/primate-run/primate/milestone/9
