---
title: Solid frontend
---

# Solid

Primate runs [Solid][Documentation] with server-side rendering, hydration,
client navigation, layouts, validation and i18n.

## Setup

### Install

```bash
npm install @primate/solid solid-js
```

### Configure

```ts
import config from "primate/config";
import solid from "@primate/solid";

export default config({
  modules: [solid()],
});
```

## Components

Create Solid components in `components` using JSX syntax.

```tsx
// components/PostIndex.tsx
import { For } from "solid-js";

interface Post {
  title: string;
  excerpt?: string;
}

interface Props {
  title: string;
  posts: Post[];
}

export default function PostIndex(props: Props) {
  return (
    <div>
      <h1>{props.title}</h1>
      <article>
        <For each={props.posts}>
          {(post) => (
            <div>
              <h2>{post.title}</h2>
              {post.excerpt && <p>{post.excerpt}</p>}
            </div>
          )}
        </For>
      </article>
    </div>
  );
}
```

Serve the component from a route:

```ts
// routes/posts.ts
import response from "primate/response";
import route from "primate/route";

route.get(() => {
  const posts = [
    { title: "First Post", excerpt: "Introduction to Primate with Solid" },
    { title: "Second Post", excerpt: "Building reactive applications" },
  ];

  return response.view("PostIndex.tsx", { title: "Blog", posts });
});
```

## Props

Props passed to `response.view` map directly to component props.

Pass props from a route:

```ts
import response from "primate/response";
import route from "primate/route";

route.get(() => response.view("User.tsx", {
  user: { name: "John", role: "Developer" },
  permissions: ["read", "write"],
}));
```

Access the props in the component:

```tsx
import { For } from "solid-js";

interface User {
  name: string;
  role: string;
}

interface Props {
  user: User;
  permissions: string[];
}

export default function User(props: Props) {
  return (
    <div>
      <h2>{props.user.name}</h2>
      <p>Role: {props.user.role}</p>
      <ul>
        <For each={props.permissions}>
          {(permission) => <li>{permission}</li>}
        </For>
      </ul>
    </div>
  );
}
```

## Reactivity with Signals

Solid's signals provide fine-grained reactivity for state management and
computed values.

```tsx
import { createSignal, createMemo } from "solid-js";

export default function Counter() {
  const [count, setCount] = createSignal(0);
  const doubled = createMemo(() => count() * 2);

  return (
    <div>
      <button onClick={() => setCount(count() - 1)}>-</button>
      <span>{count()}</span>
      <button onClick={() => setCount(count() + 1)}>+</button>
      <p>Doubled: {doubled()}</p>
    </div>
  );
}
```

## Validation

Use Primate's validated state wrapper to synchronize with backend routes.

```tsx
import validate from "@primate/solid/validate";

interface Props {
  id: string;
  counter: number;
}

export default function Counter(props: Props) {
  const counter = validate<number>(props.counter)
    .post(`/counter?id=${props.id}`);

  return (
    <div style={{ "margin-top": "2rem", "text-align": "center" }}>
      <h2>Counter Example</h2>
      <div>
        <button
          onClick={() => counter.update(n => n - 1)}
          disabled={counter.loading()}
        >
          -
        </button>
        <span style={{ margin: "0 1rem" }}>{counter.value()}</span>
        <button
          onClick={() => counter.update(n => n + 1)}
          disabled={counter.loading()}
        >
          +
        </button>
      </div>
      {counter.error()
        && <p style={{ color: "red" }}>{counter.error()!.message}</p>}
    </div>
  );
}
```

Add corresponding backend validation in the route:

```ts
// routes/counter.ts
import Counter from "#store/Counter";
import route from "primate/route";
import response from "primate/response";
import number from "pema/number";
import string from "pema/string";

await Counter.schema.create();

route.get(async () => {
  const counters = await Counter.find({});

  const counter = counters.length === 0
    ? await Counter.insert({ counter: 10 })
    : counters[0];

  return response.view("Counter.tsx", {
    id: counter.id,
    counter: counter.counter
  });
});

route.post(async request => {
  const id = string.parse(request.query.get("id"));
  const body = request.body.json(number.coerce);
  await Counter.update({ id }, { counter: body });
  return null;
});
```

The wrapper automatically tracks loading states, captures validation errors,
and posts updates on state changes.

## Forms

Create forms with Solid signals for state management and validation.

```tsx
import { createSignal } from "solid-js";

export default function LoginForm() {
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [errors, setErrors] = createSignal<{
    email?: string;
    password?: string
  }>({});

  const validateForm = () => {
    const newErrors: {email?: string; password?: string} = {};

    if (!email()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email())) {
      newErrors.email = "Email must be valid";
    }

    if (!password()) {
      newErrors.password = "Password is required";
    } else if (password().length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!validateForm()) return;

    await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email(), password: password() }),
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{
      "max-width": "400px",
      margin: "2rem auto"
    }}>
      <h2>Login</h2>

      <div style={{ "margin-bottom": "1rem" }}>
        <input
          type="email"
          placeholder="Email"
          value={email()}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            "border": "1px solid #ccc",
            "border-radius": "4px",
            "font-size": "1rem"
          }}
        />
        {errors().email && (
          <p style={{
            color: "red",
            "font-size": "0.875rem",
            "margin-top": "0.25rem"
          }}>
            {errors().email}
          </p>
        )}
      </div>

      <div style={{ "margin-bottom": "1rem" }}>
        <input
          type="password"
          placeholder="Password"
          value={password()}
          onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            "border": "1px solid #ccc",
            "border-radius": "4px",
            "font-size": "1rem"
          }}
        />
        {errors().password && (
          <p style={{
            color: "red",
            "font-size": "0.875rem",
            "margin-top": "0.25rem"
          }}>
            {errors().password}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!email() || !password()}
        style={{
          width: "100%",
          padding: "0.75rem",
          "background-color": (!email() || !password()) ? "#ccc" : "#007bff",
          color: "white",
          border: "none",
          "border-radius": "4px",
          "font-size": "1rem",
          cursor: (!email() || !password()) ? "not-allowed" : "pointer"
        }}
      >
        Submit
      </button>
    </form>
  );
}
```

Add the corresponding route:

```ts
// routes/login.ts
import route from "primate/route";
import response from "primate/response";
import pema from "pema";
import string from "pema/string";

const LoginSchema = pema({
  email: string.email(),
  password: string.min(8),
});

route.get(() => response.view("LoginForm.tsx"));

route.post(async request => {
  const body = await request.body.json(LoginSchema);

  // implement authentication logic

  return null;
});
```

## Layouts

Create layout components that wrap your pages using `children`.

Create a layout component:

```tsx
// components/Layout.tsx
import { JSX } from "solid-js";

interface Props {
  children: JSX.Element;
  brand?: string;
}

export default function Layout(props: Props) {
  return (
    <div>
      <header>
        <nav style={{ padding: "1rem", "background-color": "#f8f9fa" }}>
          <h1>{props.brand}</h1>
          <a href="/" style={{ "margin-right": "1rem" }}>Home</a>
          <a href="/about" style={{ "margin-right": "1rem" }}>About</a>
        </nav>
      </header>

      <main style={{ padding: "2rem" }}>
        {props.children}
      </main>

      <footer style={{
        padding: "1rem",
        "background-color": "#f8f9fa",
        "text-align": "center"
      }}>
        © 1996 {props.brand}
      </footer>
    </div>
  );
}
```

Next, register the layout via a `+layout.ts` file:

```ts
// routes/+layout.ts
import response from "primate/response";
import route from "primate/route";

route.get(() => response.view("Layout.tsx", { brand: "Primate Solid Demo" }));
```

Pages under this route subtree render inside the layout as `children`.

## Internationalization

Primate's `t` function is framework-agnostic. In Solid, call it directly:

```tsx
import t from "#i18n";

export default function Welcome() {
  return (
    <div>
      <h1>{t("welcome")}</h1>
      <button onClick={() => t.locale.set("en-US")}>{t("english")}</button>
      <button onClick={() => t.locale.set("de-DE")}>{t("german")}</button>
      <p>{t("current_locale")}: {t.locale.get()}</p>
    </div>
  );
}
```

Primate's integration automatically subscribes to locale changes and triggers
rerenders when switching languages.

## Head Tags

Use Primate's `Head` component to manage document head elements.

```tsx
import Head from "@primate/solid/Head";

export default function About() {
  return (
    <div style={{
      "max-width": "800px",
      margin: "2rem auto",
      padding: "0 1rem"
    }}>
      <Head>
        <title>About Us - Primate Solid Demo</title>
        <meta name="description" content="Learn more about our company" />
        <meta property="og:title" content="About Us - Primate Solid Demo" />
        <meta property="og:description" content="Learn more about our company" />
        <meta property="og:type" content="website" />
      </Head>

      <h1>About Us</h1>
      <p>
        Welcome to our Primate Solid demo application. This page demonstrates
        how to manage document head elements including the title and meta tags.
      </p>
    </div>
  );
}
```

## Configuration

| Option         | Type       | Default            | Description                  |
| -------------- | ---------- | ------------------ | ---------------------------- |
| fileExtensions | `string[]` | `[".tsx", ".jsx"]` | Associated file extensions   |
| ssr            | `boolean`  | `true`             | Active server-side rendering |
| spa            | `boolean`  | `true`             | Active client-browsing       |

### Example

```ts
import solid from "@primate/solid";
import config from "primate/config";

export default config({
  modules: [
    solid({
      // add `.solid.tsx` to associated file extensions
      fileExtensions: [".tsx", ".jsx", ".solid.tsx"],
    }),
  ],
});
```

## Resources

- [Documentation]
- [Tutorial](https://www.solidjs.com/tutorial)
- [Signals](https://www.solidjs.com/docs/latest/api#createsignal)
- [Reactivity](https://www.solidjs.com/docs/latest/api#reactivity)

[Documentation]: https://www.solidjs.com
