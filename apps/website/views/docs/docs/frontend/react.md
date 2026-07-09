---
title: React frontend
---

# React

Primate runs [React][Documentation] with server-side rendering, hydration,
client navigation, layouts, validation and i18n.

## Setup

### Install

```bash
npm install @primate/react react react-dom
```

### Configure

```ts
import config from "primate/config";
import react from "@primate/react";

export default config({
  modules: [
    react(),
  ],
});
```

## Components

Create React JSX components in `views` using TypeScript or JavaScript.

```tsx
// views/PostIndex.tsx
interface Post {
  title: string;
  excerpt?: string;
}

interface Props {
  title: string;
  posts: Post[];
}

export default function PostIndex({ title, posts }: Props) {
  return (
    <div>
      <h1>{title}</h1>
      <article>
        {posts.map((post, index) => (
          <div key={index}>
            <h2>{post.title}</h2>
            {post.excerpt && <p>{post.excerpt}</p>}
          </div>
        ))}
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

export default route({
  get() {
    const posts = [
      { title: "First Post", excerpt: "Introduction to Primate with React" },
      { title: "Second Post", excerpt: "Building reactive applications" },
    ];

    return response.view("PostIndex.tsx", { title: "Blog", posts });
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
    return response.view("User.tsx", {
      user: { name: "John", role: "Developer" },
      permissions: ["read", "write"],
    });
  },
});
```

Access the props in the component:

```tsx
interface User {
  name: string;
  role: string;
}

interface Props {
  user: User;
  permissions: string[];
}

export default function User({ user, permissions }: Props) {
  return (
    <div>
      <h2>{user.name}</h2>
      <p>Role: {user.role}</p>
      <ul>
        {permissions.map((permission, index) => (
          <li key={index}>{permission}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Request

Import the `useRequest` hook from `app:react` to access the current request
inside any component. The hook re-renders the component automatically on
client-side navigation.

```tsx
import { useRequest } from "app:react";

export default function Page() {
  const request = useRequest();

  return <p>Current path: {request.url.pathname}</p>;
}
```

The `useRequest` hook returns a `RequestPublic` object.

| Property  | Type           | Description             |
| --------- | -------------- | ----------------------- |
| `url`     | `URL`          | current request URL     |
| `query`   | `Dict<string>` | query string parameters |
| `headers` | `Dict<string>` | request headers         |
| `cookies` | `Dict<string>` | request cookies         |

## Reactivity with hooks

React's hooks provide state management and side effects for interactive
components.

```tsx
import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);
  const doubled = count * 2;

  return (
    <div>
      <button onClick={() => setCount(count - 1)}>-</button>
      <span>{count}</span>
      <button onClick={() => setCount(count + 1)}>+</button>
      <p>Doubled: {doubled}</p>
    </div>
  );
}
```

## Validation

Use Primate's validated state wrapper to synchronize with backend routes.

```tsx
import client from "@primate/react/client";

interface Props {
  id: string;
  counter: number;
}

export default function Counter({ id, counter: initial }: Props) {
  const counter = client.field(initial).post(`/counter?id=${id}`);

  return (
    <div style={{ marginTop: "2rem", textAlign: "center" }}>
      <h2>Counter Example</h2>
      <div>
        <button
          onClick={() => counter.update(n => n - 1)}
          disabled={counter.loading}
        >
          -
        </button>
        <span style={{ margin: "0 1rem" }}>{counter.value}</span>
        <button
          onClick={() => counter.update(n => n + 1)}
          disabled={counter.loading}
        >
          +
        </button>
      </div>
      {counter.error && (
        <p style={{ color: "red" }}>{counter.error.message}</p>
      )}
    </div>
  );
}
```

Add corresponding backend validation in the route:

```ts
// routes/counter.ts
import Counter from "@/stores/Counter";
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

    return response.view("Counter.tsx", {
      id: counter.id,
      counter: counter.counter,
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

Use `client.form` from `@primate/react/client` to wire forms to backend
routes with automatic field-level validation and error display.

```tsx
// views/LoginForm.tsx
import client from "@primate/react/client";

export default function LoginForm() {
  const form = client.form({ initial: { email: "", password: "" } });

  return (
    <form
      method="post"
      action="/login"
      id={form.id}
      onSubmit={form.submit}
    >
      {form.errors.length > 0 && (
        <p style={{ color: "red" }}>{form.errors[0]}</p>
      )}

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="email"
          name={form.field("email").name}
          defaultValue={form.field("email").value}
          placeholder="Email"
        />
        {form.field("email").error && (
          <p style={{ color: "red" }}>{form.field("email").error}</p>
        )}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="password"
          name={form.field("password").name}
          defaultValue={form.field("password").value}
          placeholder="Password"
        />
        {form.field("password").error && (
          <p style={{ color: "red" }}>{form.field("password").error}</p>
        )}
      </div>

      <button type="submit" disabled={form.submitting}>
        {form.submitting ? "Submitting..." : "Submit"}
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
import p from "pema";

const LoginSchema = p({
  email: p.string.email(),
  password: p.string.min(8),
});

export default route({
  get() {
    return response.view("LoginForm.tsx");
  },
  async post(request) {
    const body = LoginSchema.parse(await request.body.form());

    // implement authentication logic

    return null;
  },
});
```

Validation errors from the server are automatically surfaced per-field via
`form.field(name).error`. The `form.submitting` flag disables the submit
button while the request is in flight.

### Form API

| Property           | Type                  | Description                         |
| ------------------ | --------------------- | ----------------------------------- |
| `form.id`          | `string`              | Unique form ID for the `id` attr    |
| `form.submit`      | `(event?) => Promise` | Submit handler for `onSubmit`       |
| `form.submitting`  | `boolean`             | True while the request is in flight |
| `form.errors`      | `string[]`            | Form-level errors                   |
| `form.field(name)` | `Field`               | Access a named field                |

### Field API

| Property       | Type           | Description                     |
| -------------- | -------------- | ------------------------------- |
| `field.name`   | `string`       | Field name for the `name` attr  |
| `field.value`  | `T`            | Initial field value             |
| `field.error`  | `string\|null` | First validation error or null  |
| `field.errors` | `string[]`     | All validation errors for field |

## Layouts

Create layout components that wrap your components using `children`.

```tsx
// views/Layout.tsx
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  brand?: string;
}

export default function Layout({ children, brand = "My App" }: Props) {
  return (
    <div>
      <header>
        <nav style={{ padding: "1rem", backgroundColor: "#f8f9fa" }}>
          <h1>{brand}</h1>
          <a href="/" style={{ marginRight: "1rem" }}>Home</a>
          <a href="/about" style={{ marginRight: "1rem" }}>About</a>
        </nav>
      </header>

      <main style={{ padding: "2rem" }}>
        {children}
      </main>

      <footer style={{
        padding: "1rem",
        backgroundColor: "#f8f9fa",
        textAlign: "center",
      }}>
        © 1996 {brand}
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

export default route({
  get() {
    return response.view("Layout.tsx", { brand: "Primate React Demo" });
  },
});
```

Pages under this route subtree render inside the layout as `children`.

## Internationalization

Create an i18n bridge file that adapts Primate's headless translator to React's
reactivity model:

```ts
// lib/i18n.ts
import app from "@/config/app";
import i18n from "@primate/react/i18n";

export default i18n(app.i18n);
```

Import and use the bridged translator directly in views:

```tsx
import t from "@/lib/i18n";

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
import Head from "@primate/react/Head";

export default function About() {
  return (
    <div style={{ maxWidth: "800px", margin: "2rem auto", padding: "0 1rem" }}>
      <Head>
        <title>About Us - Primate React Demo</title>
        <meta name="description" content="Learn more about our company" />
        <meta property="og:title" content="About Us - Primate React Demo" />
        <meta property="og:description" content="Learn more about our company" />
        <meta property="og:type" content="website" />
      </Head>

      <h1>About Us</h1>
      <p>
        Welcome to our Primate React demo application. This page demonstrates
        how to manage document head elements including the title and meta tags
        for better SEO and social media sharing.
      </p>
    </div>
  );
}
```

## Configuration

| Option     | Type       | Default            | Description                  |
| ---------- | ---------- | ------------------ | ---------------------------- |
| extensions | `string[]` | `[".tsx", ".jsx"]` | Associated file extensions   |
| ssr        | `boolean`  | `true`             | Enable server-side rendering |
| csr        | `boolean`  | `true`             | Enable client-side rendering |

### Example

```ts
import react from "@primate/react";
import config from "primate/config";

export default config({
  modules: [
    react({
      // add `.react.tsx` to associated file extensions
      extensions: [".tsx", ".jsx", ".react.tsx"],
    }),
  ],
});
```

## Resources

- [Documentation]
- [Components guide](https://react.dev/learn/your-first-component)
- [Reference](https://react.dev/reference/react)

[Documentation]: https://react.dev
