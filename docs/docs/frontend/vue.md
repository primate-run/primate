# Vue

Primate runs Vue components with file-based routing, SSR, hydration, SPA
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
npm install @primate/vue vue
```

### Configure

```ts
import vue from "@primate/vue";

export default {
  modules: [vue()],
};
```

## Components

Create Vue components in `components`.

```vue
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

Serve the component from a route.

```ts
// routes/posts.ts
import view from "primate/response/view";
import route from "primate/route";

route.get(() => {
  const posts = [
    { title: "First Post", excerpt: "Introduction to Primate with Vue" },
    { title: "Second Post", excerpt: "Building reactive applications" },
  ];

  return view("PostIndex.vue", { title: "Blog", posts });
});
```

## Props

Props you pass via `view()` map 1:1 to component props.

```ts
import view from "primate/response/view";
import route from "primate/route";

route.get(() => {
  return view("User.vue", {
    user: { name: "John", role: "Developer" },
    permissions: ["read", "write"],
  });
});
```

```vue
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

## Reactivity (Composition API)

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

Use Primate's validated state wrapper to sync with a backend route.

```vue
<script lang="ts" setup>
import { computed } from "vue";
import validate from "@primate/vue/validate";

interface Props { id: string; counter: number };

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

  return view("Counter.vue", { id: counter.id, counter: counter.counter });
});

route.post(async request => {
  const id = string.parse(request.query.get("id"));
  const body = request.body.json(number.coerce);
  await Counter.update({ id }, { counter: body });
  return null;
});
```

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
    body: JSON.stringify({ email: email.value, password: password.value }),
  });
};
</script>

<template>
  <form @submit="handleSubmit" style="max-width: 400px; margin: 2rem auto;">
    <h2>Login</h2>

    <div style="margin-bottom: 1rem;">
      <input
        type="email"
        placeholder="Email"
        v-model="email"
        style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem;"
      />
      <p v-if="errors.email" style="color: red; font-size: 0.875rem; margin-top: 0.25rem;">
        {{ errors.email }}
      </p>
    </div>

    <div style="margin-bottom: 1rem;">
      <input
        type="password"
        placeholder="Password"
        v-model="password"
        style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem;"
      />
      <p v-if="errors.password" style="color: red; font-size: 0.875rem; margin-top: 0.25rem;">
        {{ errors.password }}
      </p>
    </div>

    <button
      type="submit"
      :disabled="!isFormValid"
      :style="{
        width: '100%',
        padding: '0.75rem',
        backgroundColor: isFormValid ? '#007bff' : '#ccc',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '1rem',
        cursor: isFormValid ? 'pointer' : 'not-allowed'
      }"
    >
      Submit
    </button>
  </form>
</template>
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

route.get(() => view("LoginForm.vue"));

route.post(async request => {
  const body = await request.body.json(LoginSchema);

  // authenticate

  return null;
});
```

## Layouts

Create layout components that wrap your pages.

**Layout component:**

```vue
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

    <footer style="padding: 1rem; background-color: #f8f9fa; text-align: center;">
      © 1996 {{ brand }}
    </footer>
  </div>
</template>
```

Register the layout via a `+layout.ts` file:

```ts
// routes/+layout.ts
import view from "primate/response/view";

export default {
  get() {
    return view("Layout.vue", { brand: "Primate Vue Demo" });
  },
};
```

Any page under this route subtree renders inside the layout.

## i18n

Primate's `t` is framework-agnostic. In Vue, just call it.

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

The runtime subscribes to locale changes and triggers re-renders when you switch languages.

## Head tags

```vue
<script lang="ts" setup>
import { onMounted } from "vue";

onMounted(() => {
  document.title = "About Us - Primate Vue Demo";

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

## Options

| Option     | Type       | Default             | Description               |
| ---------- | ---------- | ------------------- | ------------------------- |
| extensions | `string[]` | `[".vue"]` | Component file extensions |

```ts
import vue from "@primate/vue";

export default {
  modules: [
    vue({
      extensions: [".vue", ".component.vue"],
    }),
  ],
};
```

## Resources

- [Vue.js Documentation](https://vuejs.org)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Single File Components](https://vuejs.org/guide/scaling-up/sfc.html)
- [Reactivity Fundamentals](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)