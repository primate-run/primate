---
title: Introducing a Head component
epoch: 1695159400000
author: terrablue
---
Today we're introducing a `Head` component for React and Solid that mimics the
behavior of `<svelte:head>` for Svelte.

Primate aims for feature parity across its supported frontend frameworks.
Specifically, Svelte has a feature that React and Solid lack, the ability to
manage the `<head>` part of the HTML document individually from components.
This includes supporting client rendering, SSR, and extracting head tags from
several components embedded in each other across the component hierarchy of a
page, including layouts and imported components.

!!!
If you're new to Primate, we recommend reading the [Getting started] page to
get an idea of the framework.
!!!

## Use

In a component of your choice, import `Head` from `@primate/react` and
use it anywhere within the component.

```js caption=components/PostIndex.jsx
import Head from "@primate/react/head";

export default function (props) {
  return <>
    <Head>
      <title>All posts ({props.posts.length})</title>
    </Head>
    <h1>All posts</h1>
    {props.posts.map(({ id, title }) =>
      <h2><a href={`/post/view/${id}`}>{title}</a></h2>
    )}
    <h3><a href="/post/edit/">add post</a></h3>
  </>;
}
```

!!!
For Solid, replace `@primate/react` with `@primate/solid`.
!!!

You can also use `Head` in any layout. During SSR, a combined list of head
tags will be generated and sent along with the page. Later during hydration,
the client components will take over management of their head tags.

When you navigate between pages without a full reload, `Head` will manage its
head tags between page changes, automatically removing the tags used by the
previous page's components and inserting new ones. Tags in `pages/app.html`
won't be managed by `Head` and will be left intact.

## Use outside of Primate

As `@primate/react` and `@primate/solid` exports `/Head` and have virtually no
dependencies, you can use it even if you don't use Primate itself.

### Without SSR

If you don't care for SSR, simply import `Head` and use it within your React
or Solid components.

### With SSR

Unlike Svelte, both React and Solid compile a component entirely into a string.
That makes it difficult to extract any head parts that have been used in an
individual component down the hierarchy.

To extract the head part, we need to pass a function prop to `Head` that it can
then call with its children. This function prop then mutates a closure
variable.

To do so, we use contexts in both React and Solid. Contexts are a way for a
parent component to create props that are accessible to all its children
components, and *their* children, down the tree. Our implementation, which
you would need to replicate if you want to support SSR, looks roughly as
follows.

This function mimics the signature of a Svelte component's `render` function.

```js caption=server-render-react.js
import { renderToString } from "react-dom/server";
import { createElement } from "react";

const render = (component, props) => {
  const heads = [];
  const push_heads = sub_heads => {
    heads.push(...sub_heads);
  };
  const body = renderToString(createElement(component, {...props, push_heads}));
  const head = heads.join("\n");

  return {body, head};
};
```

And the same for Solid.

```js caption=server-render-solid.js
import { renderToString } from "solid-js/web";

export const render = (component, props) => {
  const heads = [];
  const push_heads = sub_heads => {
    heads.push(...sub_heads);
  };
  const body = renderToString(() => component({...props, push_heads}));
  const head = heads.join("\n");

  return {body, head};
};
```

The only thing left to do is wrap your root component with a context provider.
It is assumed that `body` here contains your component hierarchy.

```js caption=root-component-react.jsx
import HeadContext from "@primate/react/context/head";
import runtime from "@rcompat/runtime";

const Provider = HeadContext.Provider;

export default ({ components, data, push_heads: value }) =>
  runtime === "browser" ? body : <Provider value={value}>{body}</Provider>;
```

For Solid, use `@primate/solid` instead for the import.

We use check, using `@rcompat/runtime` if we're on the client or the server.
You don't have to do this, but using the provider on the client doesn't make a
lot of sense.

## Fin

Warm thanks to [ralyodio] for the idea and his incessant support for Primate.

If you like Primate, consider [joining our channel #primate][irc] on
irc.libera.chat.

Otherwise, have a blast with `Head`!

[Getting started]: /guide/getting-started
[irc]: https://web.libera.chat#primate
[ralyodio]: https://github.com/ralyodio
