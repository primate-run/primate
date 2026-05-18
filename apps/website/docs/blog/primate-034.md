---
title: Primate 0.34: Quality-of-life improvements
epoch: 1761503785000
author: terrablue
---

Today we're announcing the availability of the Primate 0.34 preview
release. This release focuses on quality-of-life improvements following
our TypeScript rewrite in 0.33.

!!!
If you're new to Primate, we recommend reading the [Quickstart] page to
get started.
!!!

## Versioned backend packages

Our Go, Ruby, and Python backend modules now have versioned packages
published through each language's native package infrastructure:

- **Go**: https://github.com/primate-run/go
- **Ruby**: [primate-run gem](https://rubygems.org/gems/primate-run)
- **Python**: [primate-run package](https://pypi.org/project/primate-run)

Backend modules now advertise a compatibility version that's verified at
runtime. When we introduce breaking changes in `@primate/core`, we
publish corresponding versions of our Go module, Ruby gem, and Python
package to maintain compatibility.

## `RequestBody#form` replaces `RequestBody#fields`

For improved clarity, we've renamed `fields` to `form`. Access form
fields (both normal and `multipart/form-data`) using
`request.body.form()`, which optionally accepts a validation schema.

**Breaking change**: For `multipart/form-data` requests with files,
uploaded files are now accessed separately via `request.body.files()`
instead of being included in `form()`. This aligns JavaScript usage with
our WASM backends and simplifies typing—`request.body.form()` now
returns `Record<string, string>`.

## Shortcut pema types

Pema, our validation library with integrated ORM support, now offers a
more ergonomic API similar to other validation libraries. Import the
main schema function and access validation types directly:

```ts
import p from "pema";

const Book = p({
  author: p.string.length(5, 20),
  published: p.date,
});
```

Previously, each type required a separate import (e.g.,
`import uint from "pema/uint"`).

## SPA reliability improvements

Fixed an issue where reopening a browser tab would display cached JSON
instead of HTML when navigating via SPA. The framework now:
- Sets `Cache-Control: no-store` on JSON navigation responses
- Automatically reloads if JSON is detected on page restore
- Uses self-executing module bundles for improved reliability across
  browser restore scenarios

## What's next

Check out our issue tracker for upcoming [0.35 features].

## Fin

If you like Primate, consider [joining our Discord server][discord].

[Quickstart]: /docs/quickstart
[discord]: https://discord.gg/RSg4NNwM4f
[0.35 features]: https://github.com/primate-run/primate/milestone/7
