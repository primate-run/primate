# Angular

Primate runs Angular components with file-based routing, SSR, hydration, SPA
navigation, and layouts.

## Support

| Feature                   | Status | Notes                  |
| ------------------------- | ------ | ---------------------- |
| Server-side rendering     | ✓      |                        |
| Hydration                 | ✓      |                        |
| SPA navigation            | ✓      |                        |
| [Validation](#validation) | ✓      |                        |
| [Forms](#forms)           | ✓      |                        |
| [Layouts](#layouts)       | ✓      | slot via `TemplateRef` |
| [Head tags](#head-tags)   | ✓      |                        |
| [i18n](#i18n)             | ✓      |                        |

## Setup

### Install

```bash
npm install @primate/angular
```

### Configure

```ts
import angular from "@primate/angular";

export default {
  modules: [angular()],
};
```

## Components

Create Angular components in `components`.

```ts
// components/PostIndex.component.ts
import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  imports: [CommonModule],
  template: `
    <h1>{{ title }}</h1>
    <article *ngFor="let post of posts">
      <h2>{{ post.title }}</h2>
      <p *ngIf="post.excerpt">{{ post.excerpt }}</p>
    </article>
  `,
})
export default class PostIndex {
  @Input() title = "Blog";
  @Input() posts: Array<{ title: string; excerpt?: string }> = [];
}
```

!!!
You only need a `selector` when a component is used by tag from another
component's template. Pages rendered from routes and layouts are instantiated
programmatically, so they **don't** need a selector.

If you reference a child component by tag (e.g. `<app-link>`), the child must
declare a selector, and the parent must list the child in `imports: [Child]`
(keep `CommonModule` when using `*ngIf`/`*ngFor`).
!!!

Serve the component from a route.

```ts
// routes/posts.ts
import view from "primate/response/view";
import route from "primate/route";

route.get(() => {
  const posts = [
    { title: "First Post", excerpt: "Introduction to Primate with Angular" },
    { title: "Second Post", excerpt: "Building reactive applications" },
  ];

  return view("PostIndex.component.ts", { title: "Blog", posts });
});
```

## Props -> `@Input()`

Props you pass via `view()` map 1:1 to `@Input()`s on the component.

```ts
import view from "primate/response/view";
import route from "primate/route";

route.get(() => {
  return view("User.component.ts", {
    user: { name: "John", role: "Developer" },
    permissions: ["read", "write"],
  });
});
```

```ts
import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  imports: [CommonModule],
  template: `
    <div>
      <h2>{{ user.name }}</h2>
      <p>Role: {{ user.role }}</p>
      <ul>
        <li *ngFor="let permission of permissions">{{ permission }}</li>
      </ul>
    </div>
  `,
})
export default class User {
  @Input() user: any;
  @Input() permissions: string[] = [];
}
```

## Reactivity (Signals)

```ts
import { Component, signal, computed } from "@angular/core";

@Component({
  template: `
    <div>
      <button (click)="decrement()">-</button>
      <span>{{ count() }}</span>
      <button (click)="increment()">+</button>
      <p>Doubled: {{ doubled() }}</p>
    </div>
  `,
})
export default class Counter {
  count = signal(0);
  doubled = computed(() => this.count() * 2);
  increment() { this.count.update(n => n + 1); }
  decrement() { this.count.update(n => n - 1); }
}
```

## Validation

Use Primate's validated state wrapper to sync with a backend route.

```ts
import { Component, Input } from "@angular/core";
import { NgIf } from "@angular/common";
import validate from "@primate/angular/validate";
import type Validated from "@primate/angular/Validated";

@Component({
  imports: [NgIf],
  template: `
    <h2>Counter</h2>
    <button (click)="decrement()" [disabled]="loading">-</button>
    <span>{{ value }}</span>
    <button (click)="increment()" [disabled]="loading">+</button>

    <p *ngIf="error" style="color:red">{{ error?.message }}</p>
  `,
})
export default class Counter {
  @Input() id = "";
  @Input("counter") initial = 0;

  counter!: Validated<number>;

  get value() { return this.counter.value(); }
  get loading() { return this.counter.loading(); }
  get error() { return this.counter.error(); }

  ngOnInit() {
    this.counter = validate<number>(this.initial)
      .post(`/counter?id=${this.id}`);
  }

  increment() { this.counter.update(n => n + 1); }
  decrement() { this.counter.update(n => n - 1); }
}
```

Add backend validation in route.

```ts
// routes/counter.ts
import Counter from "#store/Counter";
import route from "primate/route";
import view from "primate/response/view";
import pema from "pema";
import number from "pema/number";
import string from "pema/string";

await Counter.schema.create();

// GET page
route.get(async () => {
  const [existing] = await Counter.find({});
  const counter = existing ?? await Counter.insert({ value: 10 });
  return view("Counter.component.ts", { id: counter.id, counter: counter.value });
});

// POST updates (called by validate().post)
route.post(async request => {
  // ensure id is present
  const id = string.parse(request.query.get("id"));
  // validate/coerce
  const body = request.body.fields(pema({ value: number }).coerce);
  // persist
  await Counter.update({ id }, { value: body.value });
  return null; // 204
});
```

The wrapper tracks `loading`, captures validation errors, and posts on
`update()`.

## Forms

Install `@angular/forms`.

```sh
npm install @angular/forms
```

Create the component.

```ts
import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <input formControlName="email" placeholder="Email">
      <div *ngIf="form.get('email')?.invalid && form.get('email')?.touched">
        Email is required and must be valid
      </div>

      <input formControlName="password" type="password" placeholder="Password">
      <div *ngIf="form.get('password')?.invalid && form.get('password')?.touched">
        Password must be at least 8 characters
      </div>

      <button type="submit" [disabled]="!form.valid">Submit</button>
    </form>
  `,
})
export default class LoginForm {
  fb = inject(FormBuilder);
  form = this.fb.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(8)]],
  });

  async onSubmit() {
    if (!this.form.valid) return;

    await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(this.form.value),
    });
  }
}
```

Add the route.

```ts
// routes/login.ts
import route from "primate/route";
import pema from "pema";
import string from "pema/string";
import view from "primate/response/view";

const LoginSchema = pema({
  email: string.email,
  password: string.min(8),
});

route.get(() => view("LoginForm.component.ts"));

route.post(async request => {
  const body = await request.body.json(LoginSchema);

  // authenticate

  return null; // 204 or a redirect/response
});
```

## Layouts

For SSR + hydration, layouts accept a `slot: TemplateRef` and render it via
`*ngTemplateOutlet`. Do not use `projectableNodes`/`content`.

**Layout component:**

```ts
// components/Layout.component.ts
import { Component, Input, TemplateRef } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  imports: [CommonModule],
  template: `
    <header>
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
      </nav>
    </header>

    <main>
      <ng-container *ngTemplateOutlet="slot"></ng-container>
    </main>

    <footer>© 1996 My App</footer>
  `,
})
export default class Layout {
  @Input({ required: true }) slot!: TemplateRef<unknown>;
}
```

Register the layout via a `+layout.ts` file (layouts are normal routes; you can
pass props to them):

```ts
// routes/+layout.ts
import view from "primate/response/view";

export default {
  get() {
    // any props you pass here become @Input()s on Layout
    return view("Layout.component.ts", { /* layout props */ });
  },
};
```

Any page under this route subtree renders **inside** the layout's slot.

### Passing props to a layout

You can pass props from `+layout.ts` to the layout component as normal inputs:

```ts
// components/Layout.component.ts
import { Component, Input, TemplateRef } from "@angular/core";

@Component({
  template: `
    <header>
      <h1>{{ brand }}</h1>
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
      </nav>
    </header>

    <main>
      <ng-container *ngTemplateOutlet="slot"></ng-container>
    </main>
  `,
})
export default class Layout {
  @Input({ required: true }) slot!: TemplateRef<unknown>;
  @Input() brand = "My App";
}
```

```ts
// routes/+layout.ts
import view from "primate/response/view";

export default {
  get() {
    return view("Layout.component.ts", { brand: "Primate Angular Demo" });
  },
};
```

## i18n

Primate's `t` is framework-agnostic. In Angular, just call it.

```ts
import { Component } from "@angular/core";
import t from "#i18n";

@Component({
  template: `
    <h1>{{ t("welcome") }}</h1>
    <button (click)="set('en-US')">{{ t("english") }}</button>
    <button (click)="set('de-DE')">{{ t("german") }}</button>
    <p>{{ t("current_locale") }}: {{ current() }}</p>
  `,
})
export default class Welcome {
  t = (key: string) => t(key);
  set(locale: string) { t.locale.set(locale); }
  current() { return t.locale.get(); }
}
```

The runtime subscribes to locale changes and triggers change detection at the
root, so templates update when you switch languages.

## Head tags

```ts
import type { OnInit } from "@angular/core";
import { Component, inject } from "@angular/core";
import { Meta, Title } from "@angular/platform-browser";

@Component({
  template: "<h1>{{ pageTitle }}</h1>",
})
export default class Page implements OnInit {
  pageTitle = "About Us";
  title = inject(Title);
  meta = inject(Meta);

  ngOnInit() {
    this.title.setTitle(this.pageTitle);
    this.meta.addTag({ name: "description", content: "Learn more about us" });
    this.meta.addTag({ property: "og:title", content: this.pageTitle });
  }
}
```

## Options

| Option     | Type       | Default             | Description               |
| ---------- | ---------- | ------------------- | ------------------------- |
| extensions | `string[]` | `[".component.ts"]` | Component file extensions |

```ts
import angular from "@primate/angular";

export default {
  modules: [
    angular({
      extensions: [".component.ts", ".ng.ts"], // add more if needed
    }),
  ],
};
```

## Resources

- [Angular Documentation](https://angular.dev)
- [Angular Components Guide](https://angular.dev/guide/components)
- [Reactive Forms](https://angular.dev/guide/forms/reactive-forms)
- [Signals](https://angular.dev/guide/signals)
