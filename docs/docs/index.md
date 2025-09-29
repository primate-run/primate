# What is Primate?

Primate is the *universal web framework* for building full-stack applications.

It doesn't tie you to a single stack — it lets you freely combine frontends,
backends, databases, and runtimes into the mix that works best for you.

## Universal framework

[s=intro/frontend]

Web development today is fragmented. For almost every frontend framework,
there's a corresponding *meta-framework*: React has Next, Vue has Nuxt,
Svelte has SvelteKit. Angular tries to be both.

Once you commit, you're locked in — backend code built for one meta-framework
won't easily move to another.

Primate avoids this trap. You can use your favorite frontend with a backend that
works the same way across all of them. You can even combine different frontends
in one project, or migrate gradually without rewriting your server.

## The power of WebAssembly

[s=intro/backend]

On the backend, Primate offers the same flexibility — thanks to WebAssembly.

You can write backend code in TypeScript, JavaScript, or other languages that
compile to WebAssembly (Wasm). At runtime, Primate runs the compiled binary, not
plain JS source. This lets you bring your language of choice — Go, Python and
others — into a project while keeping full access to modern frontends.

You're not forced to use JavaScript simply because your frontend does.

## Runtime agnostic

[s=intro/runtime]

Primate runs natively on Node, Deno, and Bun. It doesn't rely on generic
compatibility layers — it uses each runtime's native execution paths, through
Primate's own compatibility layer.

Because of its design, Primate is forward-compatible: code you write today will
work on future runtimes as they emerge.

## Batteries included

Primate extends beyond core HTTP handling into common full-stack needs. It
ships with official packages under the `@primate` namespace. These extend the
core with common capabilities:

* [Databases and ORMs](/docs/stores)
* [Session management](/docs/sessions)
* [Internationalization (i18n)](/docs/i18n)
* [Native app builds (desktop)](/docs/target/native)

Everything you need to build real apps is supported out of the box.

## How Primate compares

| Feature        | Meta-frameworks (Next, Nuxt, SvelteKit) | Primate                         |
| ---------------| ----------------------------------------| --------------------------------|
| Frontend       | Tied to one (React, Vue, Svelte)        | Any frontend, mix & match       |
| Backend        | JavaScript / TypeScript only            | JS/TS plus Wasm backends |
| Runtime        | Node, others (emulated)                 | Node, Deno, Bun — native paths  |
| Vendor lock-in | High                                    | None                            |

## Why it matters

Frameworks shift. Runtimes change. Primate stays stable through that churn.
Instead of tying your application to a single ecosystem, it gives you a
foundation that outlasts frontend fads and runtime shifts — so your stack
evolves on your terms.
