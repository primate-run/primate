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
  modules: [svelte()],
});
```

## Components

Create Svelte components in `components` using Svelte's template syntax.

```svelte
<!-- components/PostIndex.svelte -->
<script lang="ts">
  export let title: string;
  export let posts: Array<{title: string; excerpt?: string}> = [];
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

route.get(() => {
  const posts = [
    { title: "First Post", excerpt: "Introduction to Primate with Svelte" },
    { title: "Second Post", excerpt: "Building reactive applications" },
  ];

  return response.view("PostIndex.svelte", { title: "Blog", posts });
});
```

## Props

Props passed to `response.view` map directly to component props.

Pass props from a route:

```ts
import response from "primate/response";
import route from "primate/route";

route.get(() => response.view("User.svelte", {
  user: { name: "John", role: "Developer" },
  permissions: ["read", "write"],
}));
```

Access the props in the component:

```svelte
<!-- components/User.svelte -->
<script lang="ts">
  export let user: {name: string; role: string};
  export let permissions: string[] = [];
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

## Reactivity with Stores

Svelte's reactivity system uses reactive statements and stores for state
management.

```svelte
<script lang="ts">
  import { writable } from 'svelte/store';

  const count = writable(0);
  const doubled = writable(0);

  $: doubled.set($count * 2);
</script>

<div>
  <button on:click={() => count.update(n => n - 1)}>-</button>
  <span>{$count}</span>
  <button on:click={() => count.update(n => n + 1)}>+</button>
  <p>Doubled: {$doubled}</p>
</div>
```

## Validation

Use Primate's validated state wrapper to synchronize with backend routes.

```svelte
<script lang="ts">
  import validate from "@primate/svelte/validate";
  export let id: string;
  export let value: number;

  const counter = validate<number>(value).post(`/counter?id=${id}`);
</script>

<div style="margin-top: 2rem; text-align: center;">
  <h2>Counter Example</h2>
  <div>
    <button
      on:click={() => counter.update((n) => n - 1)}
      disabled={$counter.loading}
    >
      -
    </button>

    <span style="margin: 0 1rem;">{$counter.value}</span>

    <button
      on:click={() => counter.update((n) => n + 1)}
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

await Counter.schema.create();

route.get(async () => {
  const counters = await Counter.find({});

  const counter = counters.length === 0
    ? await Counter.insert({ counter: 10 })
    : counters[0];

  return response.view("Counter.svelte", {
    id: counter.id,
    value: counter.counter
  });
});

route.post(async request => {
  const id = p.string.parse(request.query.get("id"));
  const body = request.body.json(p.number.coerce);
  await Counter.update({ id }, { counter: body });
  return null;
});
```

The wrapper automatically tracks loading states, captures validation errors,
and posts updates on state changes.

## Forms

Create forms with Svelte's reactive statements and two-way binding.

```svelte
<script lang="ts">
  let email = "";
  let password = "";
  let errors: {email?: string; password?: string} = {};

  function validateForm() {
    errors = {};

    if (!email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Email must be valid";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();

    if (!validateForm()) return;

    await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  }
</script>

<form on:submit={handleSubmit} style="max-width: 400px; margin: 2rem auto;">
  <h2>Login</h2>

  <div style="margin-bottom: 1rem;">
    <input type="email" placeholder="Email" bind:value={email} />
    {#if errors.email}
      <p>{errors.email}</p>
    {/if}
  </div>

  <div style="margin-bottom: 1rem;">
    <input type="password" placeholder="Password" bind:value={password} />
    {#if errors.password}
      <p>{errors.password}</p>
    {/if}
  </div>

  <button
    type="submit"
    disabled={!email || !password}
    style="width: 100%; padding: 0.75rem;
           background-color: {!email || !password ? '#ccc' : '#007bff'};
           color: white; border: none; border-radius: 4px; font-size: 1rem;
           cursor: {!email || !password ? 'not-allowed' : 'pointer'};"
  >
    Submit
  </button>
</form>
```

Add the corresponding route:

```ts
// routes/login.ts
import route from "primate/route";
import response from "primate/response";
import p from "pema";

const LoginSchema = p({
  email: p.string.email(),
  password: p.string.min(8),
});

route.get(() => response.view("LoginForm.svelte"));

route.post(async request => {
  const body = await request.body.json(LoginSchema);

  // implement authentication logic

  return null;
});
```

## Layouts

Create layout components that wrap your pages using `<slot>`.

Create a layout component:

```svelte
<!-- components/Layout.svelte -->
<script lang="ts">
  export let brand = "My App";
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
    <slot />
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

route.get(() => response.view("Layout.svelte", { brand: "Primate Svelte Demo" }));
```

Pages under this route subtree render inside the layout's `<slot>`.

## Internationalization

Primate's `t` function is framework-agnostic. In Svelte, call it directly:

```svelte
<script lang="ts">
  import t from "#i18n";
</script>

<div>
  <h1>{$t("welcome")}</h1>
  <button on:click={() => t.locale.set("en-US")}>{$t("english")}</button>
  <button on:click={() => t.locale.set("de-DE")}>{$t("german")}</button>
  <p>{$t("current_locale")}: {t.locale.get()}</p>
</div>
```

Primate's integration automatically subscribes to locale changes and triggers
rerenders when switching languages.

## Head Tags

Use Svelte's `<svelte:head>` to manage document head elements.

```svelte
<script lang="ts">
  // component logic here
</script>

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

| Option         | Type       | Default       | Description                  |
| -------------- | ---------- | ------------- | ---------------------------- |
| fileExtensions | `string[]` | `[".svelte"]` | Associated file extensions   |
| ssr            | `boolean`  | `true`        | Active server-side rendering |
| spa            | `boolean`  | `true`        | Active client-browsing       |

### Example

```ts
import svelte from "@primate/svelte";
import config from "primate/config";

export default config({
  modules: [
    svelte({
      // add `.component.svelte` to associated file extensions
      fileExtensions: [".svelte", ".component.svelte"],
    }),
  ],
});
```

## Resources

- [Documentation]
- [Tutorial](https://svelte.dev/tutorial)
- [Reactive statements](https://svelte.dev/docs#component-format-script-3-assignments)
- [Stores](https://svelte.dev/docs#run-time-svelte-store)

[Documentation]: https://svelte.dev
