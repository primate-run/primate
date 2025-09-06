# React

Primate runs React components with file-based routing, SSR, hydration, SPA
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
npm install @primate/react react react-dom
```

### Configure

```ts
import react from "@primate/react";

export default {
  modules: [react()],
};
```

## Components

Create React components in `components`.

```tsx
// components/PostIndex.tsx
import { useState } from "react";

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

Serve the component from a route.

```ts
// routes/posts.ts
import view from "primate/response/view";
import route from "primate/route";

route.get(() => {
  const posts = [
    { title: "First Post", excerpt: "Introduction to Primate with React" },
    { title: "Second Post", excerpt: "Building reactive applications" },
  ];

  return view("PostIndex.tsx", { title: "Blog", posts });
});
```

## Props

Props you pass via `view()` map 1:1 to component props.

```ts
import view from "primate/response/view";
import route from "primate/route";

route.get(() => {
  return view("User.tsx", {
    user: { name: "John", role: "Developer" },
    permissions: ["read", "write"],
  });
});
```

```tsx
import { useState } from "react";

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

## Reactivity (Hooks)

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

Use Primate's validated state wrapper to sync with a backend route.

```tsx
import validate from "@primate/react/validate";

interface Props {
  id: string;
  counter: number;
}

export default function Counter({ id, counter: initial }: Props) {
  const counter = validate<number>(initial)
    .post(`/counter?id=${id}`);

  return (
    <div style={{ marginTop: "2rem", textAlign: "center" }}>
      <h2>Counter Example</h2>
      <div>
        <button onClick={() => counter.update(n => n - 1)}
          disabled={counter.loading}>
          -
        </button>
        <span style={{ margin: "0 1rem" }}>{counter.value}</span>
        <button onClick={() => counter.update(n => n + 1)}
          disabled={counter.loading}>
          +
        </button>
      </div>
      {counter.error && <p style={{ color: "red" }}>{counter.error.message}</p>}
    </div>
  );
}
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

  return view("Counter.tsx", { id: counter.id, counter: counter.counter });
});

route.post(async request => {
  const id = string.parse(request.query.get("id"));
  const body = request.body.json(number.coerce);
  await Counter.update({ id }, { counter: body });
  return null;
});
```

## Forms

Create forms with React hooks for state management and validation.

```tsx
import { useState } from "react";

interface Props {}

export default function LoginForm(props: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});

  const validateForm = () => {
    const newErrors: {email?: string; password?: string} = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email must be valid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "400px", margin: "2rem auto" }}>
      <h2>Login</h2>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "1rem"
          }}
        />
        {errors.email && <p style={{ color: "red", fontSize: "0.875rem", marginTop: "0.25rem" }}>{errors.email}</p>}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "1rem"
          }}
        />
        {errors.password && <p style={{ color: "red", fontSize: "0.875rem", marginTop: "0.25rem" }}>{errors.password}</p>}
      </div>

      <button
        type="submit"
        disabled={!email || !password}
        style={{
          width: "100%",
          padding: "0.75rem",
          backgroundColor: (!email || !password) ? "#ccc" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          fontSize: "1rem",
          cursor: (!email || !password) ? "not-allowed" : "pointer"
        }}
      >
        Submit
      </button>
    </form>
  );
}
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

route.get(() => view("LoginForm.tsx"));

route.post(async request => {
  const body = await request.body.json(LoginSchema);

  // authenticate

  return null;
});
```

## Layouts

Create layout components that wrap your pages.

**Layout component:**

```tsx
// components/Layout.tsx
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

      <footer style={{ padding: "1rem", backgroundColor: "#f8f9fa", textAlign: "center" }}>
        © 1996 {brand}
      </footer>
    </div>
  );
}
```

Register the layout via a `+layout.ts` file:

```ts
// routes/+layout.ts
import view from "primate/response/view";

export default {
  get() {
    return view("Layout.tsx", { brand: "Primate React Demo" });
  },
};
```

Any page under this route subtree renders inside the layout.

## i18n

Primate's `t` is framework-agnostic. In React, just call it.

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

The runtime subscribes to locale changes and triggers re-renders when you switch languages.

## Head tags

```tsx
import { useEffect } from "react";
import Head from "@primate/react/Head";

interface Props {}

export default function About(props: Props) {
  useEffect(() => {
    document.title = "About Us - Primate React Demo";

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Learn more about our company and mission");
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = "Learn more about our company and mission";
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <div style={{ maxWidth: "800px", margin: "2rem auto", padding: "0 1rem" }}>
      <Head>
        <title>About Us - Primate React Demo</title>
        <meta name="description" content="Learn more about our company and mission" />
        <meta property="og:title" content="About Us - Primate React Demo" />
        <meta property="og:description" content="Learn more about our company and mission" />
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

## Options

| Option     | Type       | Default             | Description               |
| ---------- | ---------- | ------------------- | ------------------------- |
| extensions | `string[]` | `[".tsx", ".jsx"]` | Component file extensions |

```ts
import react from "@primate/react";

export default {
  modules: [
    react({
      extensions: [".tsx", ".jsx", ".component.tsx"],
    }),
  ],
};
```

## Resources

- [React Documentation](https://react.dev)
- [React Components Guide](https://react.dev/learn/your-first-component)
- [React Hooks](https://react.dev/reference/react)
- [Next.js (similar SSR approach)](https://nextjs.org)