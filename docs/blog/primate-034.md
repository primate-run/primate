---
title: Primate 0.34: Quality-of-life improvements
epoch: 1761503785
author: terrablue
---

Today we're announcing the availability of the Primate 0.34 preview release.
This release features mostly a few quality-of-life improvements in follow-up
to our last release, which rewrote Primate in TypeScript.

!!!
If you're new to Primate, we recommend reading the [Quickstart] page to get a
quick idea.
!!!

## Versioned backend packages

For our Go, Ruby and Python modules, we have also published backend packages
using the language's infrastructure for packages. For Go, it's simply our repo
at https://github.com/primate-run/go, for Ruby, we it's a `primate-run`
[Gem](https://rubygems.org/gems/primate-run) and for Python, it's a
`primate-run` [package](https://pypi.org/project/primate-run).

Those packages have their own versions, and in Primate, our backend code now
advertises a compatibility version for them, which we augment in case backend
code breaks. This version identifier is then used by `@primate/go`,
`@primate/ruby` and `@primate/python` to verify you are running the
corresponding version of the external package, to ensure the integration works.

In other words: when we introducing breaking changes in `@primate/core`, we
also publish new versions of our Go module, our Ruby gem und our Python
package, to stay aligned with Primate.

## `RequestBody#form` instead of `RequestBody#fields`

To increase clarify, we rename the `fields` method of accessing the request's
body to `form`. To access the fields of a form, whether submitted as a normal
form or as `multipart/form-data`, you now use `request.body.form`. As before,
this function optionally accepts a validation schema.

In the case of `multipart/form-data`, in case files were submitted with the
form, they will now no longer be available at `request.body.form()`, but
separately by calling `request.body.files()`. This aligns the JavaScript usage
with our Wasm backends and simplifies typing -- `request.body.form()` now
returns a `Record<string, string>`.

# Shortcut pema types

Pema, our validation with integrated ORM support, previously exported all its
runtime types separately. For example, to use `uint` validation type, you would
need to import it from `pema/uint`.

Similarly to other validation libraries, pema now allows you to import its main
schema function, `import p from "pema"`, and use it as before a schema creation
function and to access the different runtime types.

```ts
import p from "pema";

const Book = p({
  author: p.string.range(5, 20),
  published: p.date,
});
```

## What's next

Check out our issue tracker for upcoming [0.35 features].

## Fin

If you like Primate, consider [joining our Discord server][discord].

[Quickstart]: /docs/quickstart
[discord]: https://discord.gg/RSg4NNwM4f
[0.35 features]: https://github.com/primate-run/primate/milestone/7
