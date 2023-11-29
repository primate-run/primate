# Getting started

## A polymorphic development platform

In the realm of software development, many platforms tend to lock developers
into using specific technologies. Often you find yourself tied to a single
frontend framework, constrained to a particular engine, and limited mostly to
JavaScript for coding. The idea of switching frameworks, utilizing a more
efficient runtime, or integrating Python for its rich ML libraries often falls
outside the scope of these platforms.

This is where Primate stands apart. It's engineered with a focus on flexibility
and developer choice. Whether it's about selecting a frontend framework,
choosing a database, deciding on a backend technology, or picking a bundling
system, Primate offers the freedom to use what you find most suitable for your
project. Its architecture is designed for adaptability, making it
straightforward to integrate new technologies or languages as they emerge. The
concept of planned obsolescence doesn't apply here; Primate is built to evolve
with the changing technology landscape.

With Primate, you're not just working on a platform; you're engaging with a
system that respects your choices and adapts to your preferred way of working.
It's about giving developers the control they need to build software efficiently
and effectively, without the constraints of traditional platform limitations.

## First steps

To create a simple app that that responds with a `200 OK` saying "Hello, world!"
at its index route (`/`), create a project directory and a file in `routes`.

```js caption=routes/index.js
export default {
  get() {
    return "Hello, world!";
  },
};
```

To start your app, run `npx -y primate@latest` and point your browser to
http://localhost:6161.

!!!
Primate is a multi-runtime platform. If you're a Bun user, you can take
advantage of [significant speed gains][r24] by running `bun --bun x primate`.
If you're a Deno user, use `deno run --allow-all npm:primate` to run Primate.
!!!

## Multi-language support in routes

Primate isn't limited to JavaScript for your backend code. If you're a Go
developer, you can easily do the same with a Go route.

```go caption=routes/index.go
func Get(request Request) any {
  return "Hello, world!";
}
```

Or with a Python route if you're a Python developer.

```py caption=routes/index.py
def get(request):
    return "Hello, world!"
```

Same as before, run `npx -y primate@latest` and point your browser to
http://localhost:6161 to run your route.

We have upcoming support for TypeScript and other languages.

## Serving HTML

Before we continue, we recommend installing Primate by issuing
`npm install primate` in your project directory, both to make its exports
available within your project and to pin the version you're using.

Building on the last example, imagine you wanted to add a form to your page
and redirect users who have submitted the form to a success page. This requires
first changing the previous route to show a form.

```js caption=routes/index.js
import { view } from "primate";

export default {
  get() {
    return view("form.html");
  },
};
```

We also need to create an HTML component for the form.

```html caption=components/form.html
<form>
  <label for="name">Enter name</label>
  <input type="text" id="name" required />
  <label for="name">Enter age</label>
  <input type="number" id="age" required />
</form>
```

You may have noticed in our first example that we simply returned a string from
the route function, which was then translated to a `200 OK` response with
content type `text/plain`. Primate can detect the content type to use based on
the return type, but only where it makes sense. To return HTML (content type
`text/html`), we need to use the explicit request handler `view` which we
imported. It accepts the name of a component file and renders it from the
`components` directory.

If you now go to http://localhost:6161, you will see an HTML form.

Next we need to handle the form submission. We'll do that by adding a `post`
function to our route.

```js caption=routes/index.js
import { view, redirect } from "primate";

export default {
  get() {
    return view("form.html");
  },
  post(request) {
    const { name, age } = request.body;

    if (name !== undefined && age !== undefined) {
      return redirect("/success");
    }

    return redirect("/");
  },
};
```

Every route function in Primate accepts a `request` parameter that contains
request data, including the request body if applicable. Here, Primate
deserialized the form for us into `request.body` so we can easily get its
fields.

In case both `name` and `age` are set, we redirect the user to `/success` by
using the `redirect` handler Primate provides.

While we did specify in our HTML that both `name` and `age` are required
fields, we need to account for a possible client-side manipulation, so in the
alternative case that the fields aren't set, we simply redirect back to our
form.

All that's left is the success page, which we will handle by creating an
additional route file.

```js caption=routes/success.js
export default {
  get() {
    return "Thank you for submitting your data, we will get back to you.";
  },
};
```

## Using a frontend framework

Beyond pure HTML, Primate supports a variety of frontend frameworks. Here is
the same code as before, in Svelte.

First add frontend support by issuing `npm install @primate/frontend` and
loading the frontend framework of your choice in your configuration file
(create it first).

```js caption=primate.config.js
import { svelte } from "@primate/frontend";

export default {
  modules: [
    svelte(),
  ],
};
```

For Svelte, you will also need to install Svelte itself, `npm install
svelte@4`.

Now change your route to serve a Svelte component.

```js caption=routes/index.js
import { view } from "primate";

export default {
  get() {
    return view("Form.svelte", { name: "Donald" });
  },
  post(request) {
    const { name, age } = request.body;

    if (name !== undefined && age !== undefined) {
      return redirect("/success");
    }

    return redirect("/");
  },
};
```

Create the Svelte component.

```html caption=components/Form.svelte
<script>
  export let name;
</script>
<form>
  <label for="name">Enter name</label>
  <input type="text" id="name" bind:value={name} required />
  <label for="name">Enter age</label>
  <input type="number" id="age" required />
</form>
```

If you now go to http://localhost:6161, you will see an HTML form -- rendered
by Svelte.

!!!
It is likewise easily possible to write React, Vue or HTMX components. Refer to
the [frontend] module page to see what's available.
!!!

## Deeper dive

Now that we've built a trivial use case with form submission, we can start
diving a bit deeper into the platform itself and what it offers.

You don't have to read this entire guide to get productive with Primate. If you
prefer a hands-on approach, you can jump in directly into coding and refer back
to it as necessary.

By running `npm create primate@latest`, you can scaffold a fresh project. This
GUI will walk you step by step in creating a project from scratch, generating a
configuration file and including additional modules.

Alternatively you can clone the [Primate template app][primate-app] repository
and start looking around. It features an exhausive example app that includes
various additional frontend frameworks as well as a bundler, a session manager
and a data store.

## Goals

Primate strives for technical excellence, with a small core codebase and a
variety of officially supported modules that extend it. This translates into
three goals.

### Expressive

* Routes are pure functions that transform requests into responses
* Route functions accept a prepared request object with easily accessible
`body`, `path`, `query`, `cookies` and `headers` fields

### Minimal

* No dependencies aside from [`rcompat`][rcompat], a JavaScript standard
library & runtime compatibility layer
* Under 1K lines of JavaScript code (Express > 1.8K, Fastify > 5.3K)

### Extensible

* Different hooks available (`load`, `init`, `register`, `publish`, `bundle`,
`serve`, `handle`, `route`)
* Officially supported modules that are updated alongside Primate itself

## Resources

If you have a question that this guide doesn't cover, consider consulting the
code itself, asking in chat, or raising an issue.

### Code

[Primate's monorepo][repo] contains the core platform code under
`packages/primate` as well code for the official modules and the
website under `packages`.

### Chat

Primate has an IRC channel at `#primate` on irc.libera.chat. You can use the
[Libera web client][chat] if you don't have an IRC client installed.

### Issues

Feel free to open an issue on [Primate's issue tracker][issues] if you find a
bug or have a feature request.

[r24]: /blog/release-024
[repo]: https://github.com/primatejs/primate
[issues]: https://github.com/primatejs/primate/issues
[primate-app]: https://github.com/primatejs/app
[chat]: https://web.libera.chat#primate
[rcompat]: https://github.com/rcompat/rcompat
[frontend]: /modules/frontend
