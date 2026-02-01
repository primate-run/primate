---
title: Vue frontend
---

# Vue

Primate runs [Vue][Documentation] with server-side rendering, hydration, client
navigation, layouts, validation and i18n.

## Setup

### Install

```bash
npm install @primate/vue vue
```

### Configure

```ts
import config from "primate/config";
import vue from "@primate/vue";

export default config({
  modules: [vue()],
});
```

## Components

Create Vue components in `components` using Single File Component syntax.

```vue
<!-- components/PostIndex.vue -->
<script lang="ts" setup>
interface Post {
  title: string;
  excerpt?: string;
}

interface Props {
  title: string;
  posts: Post[];
}

const props = defineProps<Props>();
</script>

<template>
  <div>
    <h1>{{ title }}</h1>
    <article>
      <div v-for="post in posts" :key="post.title">
        <h2>{{ post.title }}</h2>
        <p v-if="post.excerpt">{{ post.excerpt }}</p>
      </div>
    </article>
  </div>
</template>
```

Serve the component from a route:

```ts
// routes/posts.ts
import response from "primate/response";
import route from "primate/route";

route.get(() => {
  const posts = [
    { title: "First Post", excerpt: "Introduction to Primate with Vue" },
    { title: "Second Post", excerpt: "Building reactive applications" },
  ];

  return response.view("PostIndex.vue", { title: "Blog", posts });
});
```

## Props

Props passed to `response.view` map directly to component props.

Pass props from a route:

```ts
import response from "primate/response";
import route from "primate/route";

route.get(() => response.view("User.vue", {
  user: { name: "John", role: "Developer" },
  permissions: ["read", "write"],
}));
```

Access the props in the component:

```vue
<!-- components/User.vue -->
<script lang="ts" setup>
interface User {
  name: string;
  role: string;
}

interface Props {
  user: User;
  permissions: string[];
}

const props = defineProps<Props>();
</script>

<template>
  <div>
    <h2>{{ user.name }}</h2>
    <p>Role: {{ user.role }}</p>
    <ul>
      <li v-for="permission in permissions" :key="permission">
        {{ permission }}
      </li>
    </ul>
  </div>
</template>
```

## Reactivity with Composition API

Vue's Composition API provides reactive state management with `ref` and
`computed`.

```vue
<script lang="ts" setup>
import { ref, computed } from "vue";

const count = ref(0);
const doubled = computed(() => count.value * 2);
</script>

<template>
  <div>
    <button @click="count--">-</button>
    <span>{{ count }}</span>
    <button @click="count++">+</button>
    <p>Doubled: {{ doubled }}</p>
  </div>
</template>
```

## Validation

Use Primate's validated state wrapper to synchronize with backend routes.

```vue
<script lang="ts" setup>
import { computed } from "vue";
import validate from "@primate/vue/validate";

interface Props {
  id: string;
  counter: number
}

const props = defineProps<Props>();
const counter = validate<number>(props.counter).post(`/counter?id=${props.id}`);
const loading = computed(() => counter.loading.value);
const error = computed(() => counter.error.value?.message);
</script>

<template>
  <div style="margin-top: 2rem; text-align: center;">
    <h2>Counter Example</h2>
    <div>
      <button @click="counter.update(n => n - 1)" :disabled="loading">
        -
      </button>

      <span style="margin: 0 1rem;">{{ counter.value }}</span>

      <button @click="counter.update(n => n + 1)" :disabled="loading">
        +
      </button>
    </div>

    <p v-if="counter.error" style="color: red; margin-top: 1rem;">
      {{ error }}
    </p>
  </div>
</template>
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

  return response.view("Counter.vue", {
    id: counter.id,
    counter: counter.counter
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

Create forms with Vue's Composition API and reactive data.

```vue
<script lang="ts" setup>
import { ref, computed } from "vue";

const email = ref("");
const password = ref("");
const errors = ref<{email?: string; password?: string}>({});

const isFormValid = computed(() => email.value && password.value);

const validateForm = () => {
  errors.value = {};

  if (!email.value) {
    errors.value.email = "Email is required";
  } else if (!/\S+@\S+\.\S+/.test(email.value)) {
    errors.value.email = "Email must be valid";
  }

  if (!password.value) {
    errors.value.password = "Password is required";
  } else if (password.value.length < 8) {
    errors.value.password = "Password must be at least 8 characters";
  }

  return Object.keys(errors.value).length === 0;
};

const handleSubmit = async (e: Event) => {
  e.preventDefault();

  if (!validateForm()) return;

  await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.value,
      password: password.value
    }),
  });
};
</script>

<template>
  <form @submit="handleSubmit" style="max-width: 400px; margin: 2rem auto;">
    <h2>Login</h2>

    <div style="margin-bottom: 1rem;">
      <input type="email" placeholder="Email" v-model="email" />
      <p v-if="errors.email">{{ errors.email }}</p>
    </div>

    <div style="margin-bottom: 1rem;">
      <input type="password" placeholder="Password" v-model="password" />
      <p v-if="errors.password">{{ errors.password }}</p>
    </div>

    <button
      type="submit"
      :disabled="!isFormValid"
      :style="{
        backgroundColor: isFormValid ? '#007bff' : '#ccc',
        cursor: isFormValid ? 'pointer' : 'not-allowed'
      }"
    >
      Submit
    </button>
  </form>
</template>
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

route.get(() => response.view("LoginForm.vue"));

route.post(async request => {
  const body = await request.body.json(LoginSchema);

  // implement authentication logic

  return null;
});
```

## Layouts

Create layout components that wrap your pages using `<slot>`.

Create a layout component:

```vue
<!-- components/Layout.vue -->
<script lang="ts" setup>
interface Props {
  brand?: string;
}

const props = withDefaults(defineProps<Props>(), {
  brand: "My App"
});
</script>

<template>
  <div>
    <header>
      <nav style="padding: 1rem; background-color: #f8f9fa;">
        <h1>{{ brand }}</h1>
        <a href="/" style="margin-right: 1rem;">Home</a>
        <a href="/about" style="margin-right: 1rem;">About</a>
      </nav>
    </header>

    <main style="padding: 2rem;">
      <slot />
    </main>

    <footer style="padding: 1rem; background-color: #f8f9fa;
                   text-align: center;">
      © 1996 {{ brand }}
    </footer>
  </div>
</template>
```

Next, register the layout via a `+layout.ts` file:

```ts
// routes/+layout.ts
import response from "primate/response";
import route from "primate/route";

route.get(() => response.view("Layout.vue", { brand: "Primate Vue Demo" }));
```

Pages under this route subtree render inside the layout's `<slot>`.

## Internationalization

Primate's `t` function is framework-agnostic. In Vue, call it directly:

```vue
<script lang="ts" setup>
import t from "#i18n";
</script>

<template>
  <div>
    <h1>{{ t("welcome") }}</h1>
    <button @click="t.locale.set('en-US')">{{ t("english") }}</button>
    <button @click="t.locale.set('de-DE')">{{ t("german") }}</button>
    <p>{{ t("current_locale") }}: {{ t.locale.get() }}</p>
  </div>
</template>
```

Primate's integration automatically subscribes to locale changes and triggers
rerenders when switching languages.

## Head Tags

Use Vue's `onMounted` to manage document head elements.

```vue
<script lang="ts" setup>
import { onMounted } from "vue";

onMounted(() => {
  document.title = "About Us - Primate Vue Demo";

  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute("content", "Learn more about our company");
  } else {
    const meta = document.createElement("meta");
    meta.name = "description";
    meta.content = "Learn more about our company";
    document.head.appendChild(meta);
  }
});
</script>

<template>
  <div style="max-width: 800px; margin: 2rem auto; padding: 0 1rem;">
    <h1>About Us</h1>
    <p>
      Welcome to our Primate Vue demo application. This page demonstrates
      how to manage document head elements including the title and meta tags
      for better SEO and social media sharing.
    </p>
  </div>
</template>
```

## Configuration

| Option         | Type       | Default    | Description                  |
| -------------- | ---------- | ---------- | ---------------------------- |
| fileExtensions | `string[]` | `[".vue"]` | Associated file extensions   |
| ssr            | `boolean`  | `true`     | Active server-side rendering |
| spa            | `boolean`  | `true`     | Active client-browsing       |

### Example

```ts
import vue from "@primate/vue";
import config from "primate/config";

export default config({
  modules: [
    vue({
      // add `.component.vue` to associated file extensions
      extensions: [".vue", ".component.vue"],
    }),
  ],
});
```

## Resources

- [Documentation]
- [Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Single File Components](https://vuejs.org/guide/scaling-up/sfc.html)
- [Reactivity Fundamentals](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)

[Documentation]: https://vuejs.org
