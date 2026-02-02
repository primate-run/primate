---
title: Primate 0.36: ORM relations, hooks, form validation, backend i18n
epoch: 0
author: terrablue
---

Today we're announcing the availability of the Primate 0.36 preview release.
This release introduces ORM relations across all drivers, app hooks
(middleware), support for validated forms, as well as backend i18n support.

!!!
If you're new to Primate, we recommend reading the [Quickstart] page to get
started.
!!!

## ORM relations

### key.{primary,foreign}

### relation.{one,many}

### reverse

### with

## Hooks

Intro

### `hook.ts` files

### Context propagation

## Validated forms

## Backend i18n

## Breaking changes

### `primate/store` -> `primate/orm/store`

Change all `primate/store` imports to `primate/orm/store`.

### `p.primary` -> `key.primary(...)`

Change all `p.primary`, where `p` is the default pema export, to `key.primary`,
where `key` is the default import from `primate/orm/key`. You now need to
explicitly specify the data type of the primary key column. Primate supports
strings (p.string), numbers (p.u8, p.u16, p.u32), and bigints (p.u64, p.128)
for PK types.

### ORM signatures changed

### ORM select is now `string[]` instead of `Record<string, true>`

## What's next

Check out our issue tracker for upcoming [0.37 features].

## Fin

If you like Primate, consider [joining our Discord server][discord] or starring
us on [GitHub].

[Quickstart]: /docs/quickstart
[discord]: https://discord.gg/RSg4NNwM4f
[GitHub]: https://github.com/primate-run/primate
[0.37 features]: https://github.com/primate-run/primate/milestone/9
