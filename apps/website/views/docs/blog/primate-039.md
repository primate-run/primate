---
title: Primate 0.39: Crossbuilding, typed path parameters and Marko 6
epoch: 1777628817000
author: terrablue
---

Today we're announcing the availability of the Primate 0.39 preview release.

!!!
If you're new to Primate, we recommend reading the [quickstart] page to get
started.
!!!

## Crossbuilding

Primate now supports crossbuilding — compiling your application for a different
runtime than the one you're building on. Pass `--target` to specify the output
runtime:

```sh
primate build --target=node
primate build --target=deno
primate build --target=bun
```

By default, Primate targets the runtime you're currently building on. With
crossbuilding, you can develop on Bun and deploy to Node, or build on Node and
target Deno — without changing your source code.

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

This works in React, Svelte, Vue, Solid, and Angular.

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

## Marko 6

Primate now ships full support for [Marko 6][marko], including server-side
rendering, hydration, client navigation, layouts, validation and i18n.

### Install

```bash
npm install @primate/marko marko
```

### Configure

```ts
import config from "primate/config";
import marko from "@primate/marko";

export default config({
  modules: [
    marko(),
  ],
});
```

### Components

Marko views live in `views` and receive props via the `input` object. TypeScript
interfaces are declared inline with `export interface Input`:

```marko
// views/PostIndex.marko
export interface Input {
  title: string;
  posts: { title: string; excerpt?: string }[];
}

<h1>${input.title}</h1>
<article>
  <for|post| of=input.posts>
    <div>
      <h2>${post.title}</h2>
      <if=post.excerpt>
        <p>${post.excerpt}</p>
      </if>
    </div>
  </for>
</article>
```

Serve the component from a route:

```ts
// routes/posts.ts
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    const posts = [
      { title: "First Post", excerpt: "Introduction to Primate with Marko" },
      { title: "Second Post", excerpt: "Building reactive applications" },
    ];

    return response.view("PostIndex.marko", { title: "Blog", posts });
  },
});
```

### Request

Import `request` from `app:marko` to access the current request. It updates
automatically on client-side navigation:

```marko
import { request } from "app:marko";

<p>Current path: ${request.url.pathname}</p>
```

### Validation

The `<Field>` tag from `@primate/marko/tags` synchronizes reactive state with
a backend route:

```marko
// views/Counter.marko
import { Field } from "@primate/marko/tags";

export interface Input {
  id: number;
  counter: number;
}

<Field/counter value=input.counter method="post" url=`/counter?id=${input.id}`/>

<div>
  <button onClick() { counter.update(n => n - 1); } disabled=counter.loading>-</button>
  <span>${counter.value}</span>
  <button onClick() { counter.update(n => n + 1); } disabled=counter.loading>+</button>

  <if=counter.error>
    <p style="color: red;">${counter.error.message}</p>
  </if>
</div>
```

### Forms

The `<Form>` tag from `@primate/marko/tags` wires a form to a backend route
with automatic field-level validation and error display:

```marko
// views/LoginForm.marko
import { Form } from "@primate/marko/tags";

<Form/form initial={ email: "", password: "" } />
<const/email=form.field("email")/>
<const/password=form.field("password")/>

<form method="post" action="/login" id=form.id onSubmit=form.submit>
  <if=form.errors.length>
    <p style="color: red">${form.errors[0]}</p>
  </if>

  <input type="email" name=email.name value=email.value placeholder="Email" />
  <if=email.error><p style="color: red">${email.error}</p></if>

  <input type="password" name=password.name value=password.value placeholder="Password" />
  <if=password.error><p style="color: red">${password.error}</p></if>

  <button type="submit" disabled=form.submitting>
    ${form.submitting ? "Submitting..." : "Submit"}
  </button>
</form>
```

### Layouts

Layout components receive page content via `input.content`:

```marko
// views/Layout.marko
export interface Input {
  content: Marko.Body;
}

<header>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
  </nav>
</header>

<main>
  <${input.content}/>
</main>
```

### Internationalization

Marko i18n uses the same bridge pattern as other frontends (see below). Create
a bridge file.

```ts
// lib/i18n.ts
import app from "#app";
import i18n from "@primate/marko/i18n";

export default i18n(app.i18n);
```

Import it in any view:

```marko
// views/Welcome.marko
import t from "#lib/i18n";

<span>${t.locale.get()}</span>
<span>${t("title")}</span>

<button onClick() { t.locale.set("de-DE") }>${t("german")}</button>
<button onClick() { t.locale.set("en-US") }>${t("english")}</button>
```

## Angular modernization

### Signal inputs

Angular 20 introduces signal-based inputs as the new preferred way to declare
component inputs, using `input()` and `input.required()`:

```ts
export default class CounterComponent {
  id = input<string>("");
  counter = input<number>(0);
}
```

### `NgIf` → `@if`

Angular 20 deprecates `NgIf` in favor of the built-in `@if` control flow syntax:

```ts
// before
<p *ngIf="form.submitted()">submitted</p>

// after
@if (form.submitted()) {
  <p>submitted</p>
}
```

No import needed — `@if` is built into Angular's template compiler.

### Importing components in routes

Routes can now import Angular components directly instead of referencing them
by filename string:

```ts
// before
return response.view("Counter.component.ts", counter);

// after
import CounterView from "#view/Counter";
return response.view(CounterView, counter);
```

Note that props are not yet type-checked against the component's inputs — that
requires deeper integration with Angular's type system which is planned for a
future release. That said, the import form is already preferable: you get
jump-to-definition on the component and TypeScript will catch references to
views that don't exist.

## Breaking changes

### Client imports debarrelled

The `client` named export is replaced by a default export from a dedicated
`/client` subpath across all frontends:

```ts
// before
import { client } from "@primate/svelte";

// after
import client from "@primate/svelte/client";
```

The same applies to every frontend package — replace `@primate/FRONTEND` with
`@primate/FRONTEND/client` and switch from a named to a default import.

### i18n consolidated into `app.ts`

i18n configuration now lives directly in `config/app.ts` rather than a
separate `config/i18n.ts` file:

```ts
// before — config/i18n.ts
import i18n from "primate/config/i18n";
import locale from "primate/i18n/locale";

export default i18n({
  defaultLocale: "en-US",
  locales: {
    "en-US": locale({ english: "English", german: "German" }),
    "de-DE": locale({ english: "Englisch", german: "Deutsch" }),
  },
});

// after — config/app.ts
import i18n from "primate/i18n";

export default config({
  // ...
  i18n: {
    defaultLocale: "en-US",
    locales: {
      "en-US": i18n.locale({ english: "English", german: "German" }),
      "de-DE": i18n.locale({ english: "Englisch", german: "Deutsch" }),
    },
  },
});
```

The separate `primate/config/i18n` and `primate/i18n/locale` imports are
replaced by a single `primate/i18n` entry point, with `locale` available as
`i18n.locale`.

### i18n frontend bridge required

All frontends now require an explicit i18n bridge that adapts Primate's
headless translator to the frontend's reactivity model. Create a bridge file
once per project — conventionally at `lib/i18n.ts` — and import it in your
views wherever you need translations:

```ts
// lib/i18n.ts (Svelte example)
import app from "#app";
import i18n from "@primate/svelte/i18n";

export default i18n(app.i18n);
```

The bridge import follows the same pattern for every frontend —
`@primate/FRONTEND/i18n` — and the file itself is a three-liner in all cases.
Views that previously imported `#i18n` directly should now import from
whichever path you place this bridge file.

### Session: unified import

The separate `primate/config/session` import is replaced by `primate/session`:

```ts
// before
import session from "primate/config/session";

// after
import session from "primate/session";
```

Update all `config/session.ts` files accordingly.

### `route.hook` replaces `primate/route/hook`

The separate `primate/route/hook` import is replaced by `route.hook`:

```ts
// before
import hook from "primate/route/hook";

export default hook((request, next) => {
  return next(request);
});

// after
import route from "primate/route";

export default route.hook((request, next) => {
  return next(request);
});
```

Update all hook files accordingly.

## Fin

If you like Primate, consider [joining our Discord server][discord] or starring
us on [GitHub].

[quickstart]: /docs/quickstart
[discord]: https://discord.gg/RSg4NNwM4f
[GitHub]: https://github.com/primate-run/primate
[marko]: https://markojs.com
