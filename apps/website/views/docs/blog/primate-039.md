---
title: Primate 0.39: XXX, YYY and ZZZ
epoch: 1777628817000
author: terrablue
---

Today we're announcing the availability of the Primate 0.39 preview release.

!!!
If you're new to Primate, we recommend reading the [quickstart] page to get
started.
!!!

## XXX

## YYY

## ZZZ

## Path schemas and typed path parameters

Route handlers can now declare a `path` schema alongside `body`, giving path
parameters the same validation and narrowing treatment as request bodies.

```ts
import route from "primate/route";
import p from "pema";

export default route({
  post: route.with(
    {
      contentType: "application/x-www-form-urlencoded",
      path: p({ namespace: p.string }),
      body: p({ name: p.string.min(2).max(64).regex(/^[a-z0-9-]+$/) }),
    },
    async request => {
      const { namespace } = request.path.toJSON();
      const { name } = await request.body.form();
      // namespace and name are fully typed
      return null;
    },
  ),
});
```

If the path parameters fail validation, Primate returns `400 Bad Request`
before the handler runs — consistent with how body validation works.

`request.path` is now a typed `RequestBag<T>`, meaning `get()`, `try()`,
`has()`, and `toJSON()` all return the types declared in the schema rather
than plain strings.

### Path params in route clients

When a route declares a `path` schema, TypeScript enforces it at every call
site. Calling the method directly requires passing `path`:

```ts
import route from "#route/[namespace]/project/new";

const response = await route.post({
  path: { namespace },
  body: new URLSearchParams({ name }),
});
```

Omitting `path`, or passing the wrong shape, is a compile-time error.

### Path params in `client.form`

Pass path parameters as a second argument to `client.form`:

```ts
const form = client.form(route.post, { path: { namespace } });
```

TypeScript enforces the shape of `path` based on what the route declares.
The client interpolates the URL at runtime — no manual string building
required.

This works in all five frontends: React, Svelte, Vue, Solid, and Angular.

### Typed form results

`client.form` now exposes the server's response as `form.result`, typed to
match the route handler's return type:

```tsx
const form = client.form(route.post);

// form.result is typed as { name: string; foo: string } | null
{form.submitted && <span>{JSON.stringify(form.result)}</span>}
```

`form.result` is `null` until the form is successfully submitted, and `null`
again on a `204 No Content` response.

## Fin

If you like Primate, consider [joining our Discord server][discord] or starring
us on [GitHub].

[quickstart]: /docs/quickstart
[discord]: https://discord.gg/RSg4NNwM4f
[GitHub]: https://github.com/primate-run/primate
