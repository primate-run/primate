---
title: Release 0.24: Native Bun support
epoch: 1695477283000
author: terrablue
---
Today we're announcing the availability of the Primate 0.24 preview release.
This release introduces native Bun support, enabling you to serve your
applications significantly faster than before.

Bun is a new runtime based on JavaScriptCore and written in Zig. It has
recently had its first stable version, and has seen an uptick in interest ever
since.

!!!
If you're new to Primate, we recommend reading the [Getting started] page to
get an idea of the framework.
!!!

## Native Bun support

When Bun 1.0 came out, we were quick to test running Primate using Bun's NPM
compatibility. As it turned out, running `bun x primate` works as expected and
runs a Primate app without issues.

However, the real promise of Bun lies in its fast HTTP library implementation,
`Bun.serve`. Bun's NPM compatibility is great, but to get real speed gains over
Node, we have to use its native standard library.

As it turns out, Primate already uses a standard library of its own, `rcompat`.
As Primate is not the only project using it, we decided to implement native Bun
support into it and thus have Primate and other projects benefit from it. This
release uses the latest release of `rcompat`, which uses Bun natively wherever
possible and falls back to Node/NPM otherwise.

In addition to the core package, we have also patched `@primate/store` to use
Bun's native `bun:sqlite` module.

## Benchmarks

To illustrate the difference in serving Primate with native Bun, we created a
threeway benchmark: running Primate with NPM (`npx primate`), running it with
Bun's NPM compatibility (`bun x primate`), and running it natively with Bun
(`bun --bun x primate`).

Using the `ab` testing tool, we tested two scenarios, serving plain-text
content and an SSR-rendered Svelte page.

Our command for benchmarking was `ab -c 350 -n 100000 [url]`. That is, send
100000 requests with a concurrency of 350 requests at a time.

The app we used for testing was the [Primate template app][template-app].
To replicate the benchmarks, clone that repository and run the app.

In the following benchmarks, the quantities are:
* **TT** Time taken for tests (seconds)
* **RPS** Requests per second
* **TPR** Time per request (milliseconds) (mean, across all concurrent requests)
* **TR** Transfer rate, in Kbytes/second

### Plain-text

Command used `ab -c 350 -n 100000 http://localhost:6161/benchmark`

|Server               |TT (s)|RPS    |TPR (ms)|TR (Kbytes/s)
|---------------------|------|-------|--------|------------|
|`npx primate`        |72.228|1384.50|0.722   |809.88      |
|`bun x primate`      |72.688|1375.74|0.727   |804.75      |
|`bun --bun x primate`|18.488|5408.98|0.185   |3169.33     |

![](/bun-benchmark-plain.png)

### Svelte

Command used `ab -c 350 -n 100000 http://localhost:6161/benchmark/svelte`

|Server               |TT (s) |RPS    |TPR (ms)|TR (Kbytes/s)
|---------------------|-------|-------|--------|------------|
|`npx primate`        |117.646|850.01 |1.176   |2560.81     |
|`bun x primate`      |115.408|866.49 |1.154   |2610.48     |
|`bun --bun x primate`|29.981 |3335.40|0.300   |10058.33    |

![](/bun-benchmark-svelte.png)

## Caveats

In upcoming releases, we'll continue to improve Primate's support for Bun,
using native modules and functions wherever possible. Currently, if you rely on
`@primate/ws` for WebSockets in your application, you would have to stick to
NPM. Bun's native WebSocket implementation is radically different from the `ws`
package which `@primate/ws` uses, and unifying them was deemed out of scope for
this release. Please reach out if you specifically need WebSockets in your
application so we can better prioritize our work.

## Other changes

Consult the [full changelog][changelog] for a list of all relevant changes.

## Next on the road

Some of the things we plan to tackle in the upcoming weeks are,

* Add projections and relations to stores
* Multidriver transactions
* Introduce IDE TypeScript support
* Add a `command` hook that would allow modules to register command line
  namespaces, to be able to run `npx primate [namespace] [command] [flags]`
* Use this new hook to create database migrations for SQL-flavored databases
* Extend `create-primate` with the ability to add new routes
* Add hydration and liveview support for `@primate/vue`
* Support the `multipart/form-data` content type
* Flesh out stores with default values, additional predicates and relations
  between tables/collections
* Add more type variants

This list isn't exhaustive or binding. None, some or all of these features may
be included in 0.25, and other features may be prioritized according to
feedback.

## Fin

If you like Primate, consider [joining our channel #primate][irc] on
irc.libera.chat.

Otherwise, have a blast with the new version!

[Getting started]: /guide/getting-started
[irc]: https://web.libera.chat#primate
[changelog]: https://github.com/primate-run/primate/releases/tag/0.24.0
[template-app]: https://github.com/primate-run/app
