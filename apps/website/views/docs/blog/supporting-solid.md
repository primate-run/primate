---
title: Adding Solid support
epoch: 1691948898000
author: terrablue
---
Today we're adding another frontend framework to our growing list of supported
handlers, [Solid]. The new handler is fully compatible with the current 0.21
release.

Support for Solid includes server-side rendering (SSR), hydration, layouting,
as well as liveview integration. Having recently added hydration, layouts and
liveview to React, this brings to three the number of frontend frameworks we
fully support.

!!!
If you're new to Primate, we recommend reading the [Getting started] page to
get an idea of the framework.
!!!

## Install

To install the Solid module, run `npm install @primate/solid`. Then add it to
your Primate configuration.

```js caption=primate.config.js
import solid from "@primate/solid";

export default {
  modules: [
    solid(),
  ],
};
```

Supporting Solid has been challenging in the sense that like React, it uses JSX
components, but unlike React, it uses them slightly differently, calling for
a different compiling method to JavaScript. In addition, this is the first time
we have encountered potential file extension conflicts, as both handlers use
the `jsx` file extension. To nonetheless allow users to work with both
frameworks side by side, we have added an `extension` option you can pass the
Solid handler, to override its `jsx` default.

```js caption=primate.config.js
import solid from "@primate/solid";

export default {
  modules: [
    solid({
      extension: "solid",
    }),
  ],
};
```

This would allow you to create Solid components with the `solid` extension and
place them alongside React (`jsx`) components.

## Use

To use a Solid component, create a route under `routes`. This example assumes
you have changed the Solid component file extension to `solid`.

```js caption=routes/posts.js
import view from "primate/handler/view";

const posts = [{
  id: 1,
  title: "First post",
}];

export default {
  get() {
    return view("PostIndex.solid", { posts });
  },
};
```

Next, create a component in `components`.

```jsx caption=components/PostIndex.solid
import { For } from "solid-js/web";

export default function (props) {
  return <>
    <h1>All posts</h1>
    <For each={props.data.posts}>
      {post => <h2><a href={`/post/view/${post.id}`}>{post.title}</a></h2>}
    </For>
    <h3><a href="/post/edit/">add post</a></h3>
  </>;
}
```

## Add a layout

Create a `+layout.js` file alongside your routes (layouts apply to all routes
in their directory and its subdirectories, hierarchically).

```js caption=routes/+layout.js
import view from "primate/handler/view";

export default () => {
  return view("layout.solid", { user: "Tom" });
};
```

Then add a component for the layout in `components`.

```jsx caption=components/layout.solid
export default function layout(props) {
  return <>
    <div>Hi, {props.data.user}.</div>
    {props.children}
  </>;
}
```

## Activate liveview

To activate liveview for Solid, turning your app into an SPA and avoiding full
page reloads, install and load `@primate/liveview`.

```js caption=primate.config.js
import solid from "@primate/solid";
import liveview from "@primate/liveview";

export default {
  modules: [
    solid(),
    liveview(),
  ],
};
```

## Fin

If you like Primate, consider [joining our channel #primate][irc] on
irc.libera.chat.

Otherwise, have a blast with Solid!

[Getting started]: /guide/getting-started
[Solid]: https://www.solidjs.com
[irc]: https://web.libera.chat#primate
