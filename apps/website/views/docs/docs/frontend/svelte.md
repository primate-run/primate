---
title: Svelte frontend
---

# Svelte

Primate runs [Svelte][Documentation] with server-side rendering, hydration,
client navigation, layouts, validation and i18n.

## Setup

### Install

```bash
npm install @primate/svelte svelte
```

### Configure

```ts
import config from "primate/config";
import svelte from "@primate/svelte";

export default config({
  modules: [
    svelte(),
  ],
});
```

## Components

Create Svelte components in `views`.

```svelte
<!-- views/PostIndex.svelte -->
<script lang="ts">
  const { title, posts = [] }: {
    title: string;
    posts: {title: string; excerpt?: string}[];
  } = $props();
</script>

<div>
  <h1>{title}</h1>
  <article>
    {#each posts as post}
      <div>
        <h2>{post.title}</h2>
        {#if post.excerpt}
          <p>{post.excerpt}</p>
        {/if}
      </div>
    {/each}
  </article>
</div>
```

Serve the component from a route:

```ts
// routes/posts.ts
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    const posts = [
      { title: "First Post", excerpt: "Introduction to Primate with Svelte" },
      { title: "Second Post", excerpt: "Building reactive applications" },
    ];

    return response.view("PostIndex.svelte", { title: "Blog", posts });
  },
});
```

## Props

Props passed to `response.view` map directly to component props.

Pass props from a route:

```ts
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view("User.svelte", {
      user: { name: "John", role: "Developer" },
      permissions: ["read", "write"],
    });
  },
});
```

Access the props in the component:

```svelte
<!-- views/User.svelte -->
<script lang="ts">
  const { user, permissions = [] }: {
    user: {name: string; role: string};
    permissions: string[];
  } = $props();
</script>

<div>
  <h2>{user.name}</h2>
  <p>Role: {user.role}</p>
  <ul>
    {#each permissions as permission}
      <li>{permission}</li>
    {/each}
  </ul>
</div>
```

## Request

Import the `request` store from `app:svelte` to access the current request
inside any component. The store is reactive — it updates automatically on
client-side navigation.

```svelte
<script lang="ts">
  import { request } from "app:svelte";
</script>

<p>Current path: {$request.url.pathname}</p>
```

The `request` store exposes a `RequestPublic` object.

| Property  | Type           | Description             |
| --------- | -------------- | ----------------------- |
| `url`     | `URL`          | current request URL     |
| `query`   | `Dict<string>` | query string parameters |
| `headers` | `Dict<string>` | request headers         |
| `cookies` | `Dict<string>` | request cookies         |

## Reactivity

Svelte 5 uses runes for fine-grained reactivity.

```svelte
<script lang="ts">
  let count = $state(0);
  const doubled = $derived(count * 2);
</script>

<div>
  <button onclick={() => count--}>-</button>
  <span>{count}</span>
  <button onclick={() => count++}>+</button>
  <p>Doubled: {doubled}</p>
</div>
```

## Validation

Use Primate's validated state wrapper to synchronize with backend routes.

```svelte
<script lang="ts">
  import client from "@primate/svelte/client";

  const props: { id: string; counter: number } = $props();
  const counter = client.field(props.counter).post(`/counter?id=${props.id}`);
</script>

<div style="margin-top: 2rem; text-align: center;">
  <h2>Counter Example</h2>
  <div>
    <button
      onclick={() => counter.update((n) => n - 1)}
      disabled={$counter.loading}
    >
      -
    </button>

    <span style="margin: 0 1rem;">{$counter.value}</span>

    <button
      onclick={() => counter.update((n) => n + 1)}
      disabled={$counter.loading}
    >
      +
    </button>
  </div>

  {#if $counter.error}
    <p style="color: red; margin-top: 1rem;">
      {$counter.error.message}
    </p>
  {/if}
</div>
```

Add corresponding backend validation in the route:

```ts
// routes/counter.ts
import Counter from "#store/Counter";
import route from "primate/route";
import response from "primate/response";
import p from "pema";

await Counter.create();

export default route({
  async get() {
    const counters = await Counter.find({});

    const counter = counters.length === 0
      ? await Counter.insert({ counter: 10 })
      : counters[0];

    return response.view("Counter.svelte", {
      id: counter.id,
      value: counter.counter
    });
  },
  async post(request) {
    const id = p.string.parse(request.query.get("id"));
    const body = p.loose.number.parse(await request.body.json());
    await Counter.update(id, { set: { counter: body } });
    return null;
  },
});
```

The wrapper automatically tracks loading states, captures validation errors,
and posts updates on state changes.

## Forms

Use `client.form` from `@primate/svelte/client` to wire forms to backend
routes with automatic field-level validation and error display.

```svelte
<!-- views/LoginForm.svelte -->
<script lang="ts">
  import client from "@primate/svelte/client";

  const form = client.form({ initial: { email: "", password: "" } });
</script>

<form
  method="post"
  action="/login"
  id={$form.id}
  onsubmit={$form.submit}
>
  {#if $form.errors.length}
    <p style="color: red">{$form.errors[0]}</p>
  {/if}

  <div style="margin-bottom: 1rem;">
    <input
      type="email"
      name={$form.field("email").name}
      value={$form.field("email").value}
      placeholder="Email"
    />
    {#if $form.field("email").error}
      <p style="color: red">{$form.field("email").error}</p>
    {/if}
  </div>

  <div style="margin-bottom: 1rem;">
    <input
      type="password"
      name={$form.field("password").name}
      value={$form.field("password").value}
      placeholder="Password"
    />
    {#if $form.field("password").error}
      <p style="color: red">{$form.field("password").error}</p>
    {/if}
  </div>

  <button type="submit" disabled={$form.submitting}>
    {$form.submitting ? "Submitting..." : "Submit"}
  </button>
</form>
```

Add the corresponding route with server-side validation:

```ts
// routes/login.ts
import route from "primate/route";
import response from "primate/response";
import p from "pema";

const LoginSchema = p({
  email: p.string.email(),
  password: p.string.min(8),
});

export default route({
  get() {
    return response.view("LoginForm.svelte");
  },
  async post(request) {
    const body = LoginSchema.parse(await request.body.form());

    // implement authentication logic

    return null;
  },
});
```

Validation errors from the server are automatically surfaced per-field via
`$form.field(name).error`. The `$form.submitting` flag disables the submit
button while the request is in flight.

### Form API

| Property              | Type                    | Description                        |
| --------------------- | ----------------------- | ---------------------------------- |
| `$form.id`            | `string`                | Unique form ID for the `id` attr   |
| `$form.submit`        | `(event?) => Promise`   | Submit handler for `onsubmit`      |
| `$form.submitting`    | `boolean`               | True while the request is in flight |
| `$form.errors`        | `string[]`              | Form-level errors                  |
| `$form.field(name)`   | `Field`                 | Access a named field               |

### Field API

| Property              | Type           | Description                        |
| --------------------- | -------------- | ---------------------------------- |
| `field.name`          | `string`       | Field name for the `name` attr     |
| `field.value`         | `T`            | Initial field value                |
| `field.error`         | `string\|null` | First validation error or null     |
| `field.errors`        | `string[]`     | All validation errors for field    |

## Layouts

Create layout components that wrap your pages using `{@render children()}`.

Create a layout component:

```svelte
<!-- views/Layout.svelte -->
<script lang="ts">
  const { brand = "My App", children }: {
    brand?: string;
    children: import("svelte").Snippet;
  } = $props();
</script>

<div>
  <header>
    <nav style="padding: 1rem; background-color: #f8f9fa;">
      <h1>{brand}</h1>
      <a href="/" style="margin-right: 1rem;">Home</a>
      <a href="/about" style="margin-right: 1rem;">About</a>
    </nav>
  </header>

  <main style="padding: 2rem;">
    {@render children()}
  </main>

  <footer style="padding: 1rem; background-color: #f8f9fa; text-align: center;">
    © 1996 {brand}
  </footer>
</div>
```

Next, register the layout via a `+layout.ts` file:

```ts
// routes/+layout.ts
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view("Layout.svelte", { brand: "Primate Svelte Demo" });
  },
});
```

Pages under this route subtree render inside the layout's `{@render children()}`.

## Internationalization

Create an i18n bridge file that adapts Primate's headless translator to
Svelte's reactivity model:

```ts
// lib/i18n.ts
import app from "#app";
import i18n from "@primate/svelte/i18n";

export default i18n(app.i18n);
```

Import and use the bridged translator directly in views:

```svelte
<script lang="ts">
  import t from "#lib/i18n";
</script>

<div>
  <h1>{$t("welcome")}</h1>
  <button onclick={() => t.locale.set("en-US")}>{$t("english")}</button>
  <button onclick={() => t.locale.set("de-DE")}>{$t("german")}</button>
  <p>{$t("current_locale")}: {t.locale.get()}</p>
</div>
```

Primate's integration automatically subscribes to locale changes and triggers
rerenders when switching languages.

## Head Tags

Use Svelte's `<svelte:head>` to manage document head elements.

```svelte
<svelte:head>
  <title>About Us - Primate Svelte Demo</title>
  <meta name="description" content="Learn more about our company" />
  <meta property="og:title" content="About Us - Primate Svelte Demo" />
  <meta property="og:description" content="Learn more about our company" />
  <meta property="og:type" content="website" />
</svelte:head>

<div style="max-width: 800px; margin: 2rem auto; padding: 0 1rem;">
  <h1>About Us</h1>
  <p>
    Welcome to our Primate Svelte demo application. This page demonstrates
    how to manage document head elements including the title and meta tags
    for better SEO and social media sharing.
  </p>
</div>
```

## Configuration

| Option     | Type       | Default       | Description                  |
| ---------- | ---------- | ------------- | ---------------------------- |
| extensions | `string[]` | `[".svelte"]` | Associated file extensions   |
| ssr        | `boolean`  | `true`        | Enable server-side rendering |
| csr        | `boolean`  | `true`        | Enable client-side rendering |

### Example

```ts
import svelte from "@primate/svelte";
import config from "primate/config";

export default config({
  modules: [
    svelte({
      // add `.component.svelte` to associated file extensions
      extensions: [".svelte", ".component.svelte"],
    }),
  ],
});
```

## Resources

- [Documentation]
- [Tutorial](https://svelte.dev/tutorial)
- [Runes](https://svelte.dev/docs/svelte/what-are-runes)
- [Stores](https://svelte.dev/docs#run-time-svelte-store)

[Documentation]: https://svelte.dev
