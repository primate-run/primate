# Svelte

Primate runs Svelte components with file-based routing, SSR, hydration, SPA
navigation, and layouts.

## Support

| Feature                   | Status | Notes                  |
| ------------------------- | ------ | ---------------------- |
| Server-side rendering     | ✓      |                        |
| Hydration                 | ✓      |                        |
| SPA navigation            | ✓      |                        |
| [Validation](#validation) | ✓      |                        |
| [Forms](#forms)           | ✓      |                        |
| [Layouts](#layouts)       | ✓      |                        |
| [Head tags](#head-tags)   | ✓      |                        |
| [i18n](#i18n)             | ✓      |                        |

## Setup

### Install

```bash
npm install @primate/svelte svelte
```

### Configure

```ts
import svelte from "@primate/svelte";

export default {
  modules: [svelte()],
};
```

## Components

Create Svelte components in `components`.

```svelte
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

Serve the component from a route.

```ts
// routes/posts.ts
import view from "primate/response/view";
import route from "primate/route";

route.get(() => {
  const posts = [
    { title: "First Post", excerpt: "Introduction to Primate with Svelte" },
    { title: "Second Post", excerpt: "Building reactive applications" },
  ];

  return view("PostIndex.svelte", { title: "Blog", posts });
});
```

## Props

Props you pass via `view()` map 1:1 to component props.

```ts
import view from "primate/response/view";
import route from "primate/route";

route.get(() => {
  return view("User.svelte", {
    user: { name: "John", role: "Developer" },
    permissions: ["read", "write"],
  });
});
```

```svelte
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

## Reactivity (Stores)

```svelte
<script lang="ts">
  let count = 0;
  $: doubled = count * 2;
</script>

<div>
  <button on:click={() => count--}>-</button>
  <span>{count}</span>
  <button on:click={() => count++}>+</button>
  <p>Doubled: {doubled}</p>
</div>
```

## Validation

Use Primate's validated state wrapper to sync with a backend route.

```svelte
<script lang="ts">
  import validate from "@primate/svelte/validate";
  export let id: string;
  export let counter: number;

  const _counter = validate<number>(counter).post(`/counter?id=${id}`);
</script>

<div style="margin-top: 2rem; text-align: center;">
  <h2>Counter Example</h2>
  <div>
    <button
      on:click={() => _counter.update((n) => n - 1)}
      disabled={$_counter.loading}
    >
      -
    </button>

    <span style="margin: 0 1rem;">{$_counter.value}</span>

    <button
      on:click={() => _counter.update((n) => n + 1)}
      disabled={$_counter.loading}
    >
      +
    </button>
  </div>

  {#if $_counter.error}
    <p style="color: red; margin-top: 1rem;">
      {$_counter.error.message}
    </p>
  {/if}
</div>
```

Add backend validation in route.

```ts
// routes/counter.ts
import Counter from "#store/Counter";
import route from "primate/route";
import view from "primate/response/view";
import number from "pema/number";
import string from "pema/string";

await Counter.schema.create();

route.get(async () => {
  const counters = await Counter.find({});

  const counter = counters.length === 0
    ? await Counter.insert({ counter: 10 })
    : counters[0];

  return view("Counter.svelte", { id: counter.id, counter: counter.counter });
});

route.post(async request => {
  const id = string.parse(request.query.get("id"));
  const body = request.body.json(number.coerce);
  await Counter.update({ id }, { counter: body });
  return null;
});
```

## Forms

Create forms with Svelte's reactive statements and two-way binding.

```svelte
<script lang="ts">
  let email = '';
  let password = '';
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

    await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  }
</script>

<form on:submit={handleSubmit} style="max-width: 400px; margin: 2rem auto;">
  <h2>Login</h2>

  <div style="margin-bottom: 1rem;">
    <input
      type="email"
      placeholder="Email"
      bind:value={email}
      style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem;"
    />
    {#if errors.email}
      <p style="color: red; font-size: 0.875rem; margin-top: 0.25rem;">{errors.email}</p>
    {/if}
  </div>

  <div style="margin-bottom: 1rem;">
    <input
      type="password"
      placeholder="Password"
      bind:value={password}
      style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem;"
    />
    {#if errors.password}
      <p style="color: red; font-size: 0.875rem; margin-top: 0.25rem;">{errors.password}</p>
    {/if}
  </div>

  <button
    type="submit"
    disabled={!email || !password}
    style="width: 100%; padding: 0.75rem; background-color: {!email || !password ? '#ccc' : '#007bff'}; color: white; border: none; border-radius: 4px; font-size: 1rem; cursor: {!email || !password ? 'not-allowed' : 'pointer'};"
  >
    Submit
  </button>
</form>
```

Add the route.

```ts
// routes/login.ts
import route from "primate/route";
import view from "primate/response/view";
import pema from "pema";
import string from "pema/string";

const LoginSchema = pema({
  email: string.email,
  password: string.min(8),
});

route.get(() => view("LoginForm.svelte"));

route.post(async request => {
  const body = await request.body.json(LoginSchema);

  // authenticate

  return null;
});
```

## Layouts

Create layout components that wrap your pages.

**Layout component:**

```svelte
<script lang="ts">
  import { page } from "$app/stores";
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

Register the layout via a `+layout.ts` file:

```ts
// routes/+layout.ts
import view from "primate/response/view";

export default {
  get() {
    return view("Layout.svelte", { brand: "Primate Svelte Demo" });
  },
};
```

Any page under this route subtree renders inside the layout.

## i18n

Primate's `t` is framework-agnostic. In Svelte, just call it.

```svelte
<script lang="ts">
  import t from "#i18n";
</script>

<div>
  <h1>{t("welcome")}</h1>
  <button on:click={() => t.locale.set("en-US")}>{t("english")}</button>
  <button on:click={() => t.locale.set("de-DE")}>{t("german")}</button>
  <p>{t("current_locale")}: {t.locale.get()}</p>
</div>
```

The runtime subscribes to locale changes and triggers re-renders when you switch languages.

## Head tags

```svelte
<script lang="ts">
  import { onMount } from "svelte";

  onMount(() => {
    document.title = "About Us - Primate Svelte Demo";

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Learn more about our company and mission");
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = "Learn more about our company and mission";
      document.head.appendChild(meta);
    }
  });
</script>

<div style="max-width: 800px; margin: 2rem auto; padding: 0 1rem;">
  <h1>About Us</h1>
  <p>
    Welcome to our Primate Svelte demo application. This page demonstrates
    how to manage document head elements including the title and meta tags
    for better SEO and social media sharing.
  </p>
</div>
```

## Options

| Option     | Type       | Default             | Description               |
| ---------- | ---------- | ------------------- | ------------------------- |
| extensions | `string[]` | `[".svelte"]` | Component file extensions |

```ts
import svelte from "@primate/svelte";

export default {
  modules: [
    svelte({
      extensions: [".svelte", ".component.svelte"],
    }),
  ],
};
```

## Resources

- [Svelte Documentation](https://svelte.dev)
- [Svelte Tutorial](https://svelte.dev/tutorial)
- [Reactive Statements](https://svelte.dev/docs#component-format-script-3-assignments)
- [Stores](https://svelte.dev/docs#run-time-svelte-store)