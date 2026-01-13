---
title: Release 0.22: Solid and Markdown support, build transformations
epoch: 1692880155000
author: terrablue
---
Today we're announcing the availability of the Primate 0.22 preview release.
This release comes along with 2 new frontend handlers (Solid, Markdown),
full React support and build transformations.

!!!
If you're new to Primate, we recommend reading the [Getting started] page to
get an idea of the framework.
!!!

## New frontend handlers

This release adds 2 new frontend handlers, for Solid and Markdown. We've
already written separately about
[Solid in our last post](/blog/supporting-solid).

In addition, support for Markdown (`.md`) files has been introduced with
`@primate/markdown`. This frontend handler currently supports basic Markdown
syntax. In the future we plan to extend this by supporting Mermaid and other
extended syntax, potentially via an extension system.

The Markdown handler works like all other frontend handlers. To activate it,
load the module in your configuration.

```js caption=primate.config.js
import markdown from "@primate/markdown";

export default {
  modules: [
    markdown(),
  ],
};
```

Then place a Markdown file in your `components` directory.

```md caption=components/about-us.md
# About us

Our company was formed in 2023 with the vision of supplying **unlimited**
energy to mankind.
```

Lastly, serve your Markdown component from a route of your choice.

```js caption=routes/about-us.js
import view from "primate/handler/view";

export default {
  get() {
    return view("about-us.md");
  },
};
```

If you then run Primate, your Markdown component should be served at
`GET /about-us` as HTML.

Unlike other frontend handlers, the Markdown handler is not dynamic. Passing
props to it is meaningless. However, you can still use a different page with it
by modifying the `page` property of the third (options) parameter.

```js caption=routes/about-us.js
import view from "primate/handler/view";

export default {
  get() {
    return view("about-us.md", {}, { page: "alternative-page.html" });
  },
};
```

The above route will serve the compiled Markdown component embedded into the
`pages/alternative-page.html` HTML page.

Like other frontend handlers, you can change the directory from which Markdown
components are loaded and the file extension associated with them by changing
the module configuration.

```js caption=primate.config.js
import markdown from "@primate/markdown";

export default {
  modules: [
    markdown({
      // load Markdown files from $project_root$/content
      // default: `config.location.components`
      directory: "content",
      // using the "markdown" file extension
      // default: "md"
      extension: "markdown",
    }),
  ],
};
```

In addition, you can pass options to the underlying `marked` package used to
convert the Markdown files into HTML.

```js caption=primate.config.js
import markdown from "@primate/markdown";

export default {
  modules: [
    markdown({
      options: {
        postprocess(html) {
          return html.replaceAll(/!!!\n(.*?)\n!!!/gus, (_, p1) =>
            `<div class="box">${p1}</div>`);
        },
      },
    }),
  ],
};
```

The Markdown handler, when converting the component into HTML, also generates a
table of contents using the six Markdown heading types (which correspond to the
h1-h6 HTML tags).

```md caption=components/about-us.md
# Heading 1

## Heading 2

### Heading 3

## Another heading 2
```

Given that Markdown, the following JSON file will be created.

```json
[
  {
    "text": "Heading 1",
    "level": 1,
    "name": "heading-1"
  },
  {
    "text": "Heading 2",
    "level": 2,
    "name": "heading-2"
  },
  {
    "text": "Heading 3",
    "level": 3,
    "name": "heading-3"
  },
  {
    "text": "Another heading 2",
    "level": 2,
    "name": "another-heading-2"
  },
]
```

At runtime, this JSON file will be written to `build/server/${directory}`
alongside the compiled HTML file. To use this, you can override the default
Markdown handler function.

```js caption=primate.config.js
import markdown from "@primate/markdown";

export default {
  modules: [
    markdown({
      handler: ({ content, toc }) => (app, ...rest) =>
        app.handlers.svelte("Markdown.svelte", { content, toc })(app, ...rest),
    }),
  ],
};
```

This allows you to circumvent the default Markdown handler and hand over the
compiled HTML content and JSON table of contents to a dynamic component, in
this case Svelte, for embedding.

In addition to all of the above, you can also access the Markdown compilation
function directly as an export of `@primate/markdown`. This allows you to
compile and serve Markdown content from a dynamic source (like a database).

```js caption=routes/markdown/{page}.js
import view from "primate/handler/view";
import { compile } from "@primate/markdown";

export default {
  get(request) {
    const page = request.path.get("page");

    // this assumes you have a data store called Markdown
    const [markdown] = await request.store.Markdown.find({ page });

    const { content, toc } = compile(markdown.text);

    return view("Markdown.svelte", { content, toc });
  },
};
```

!!!
The above example compiles the Markdown text on every request without any form
of caching or checking for changes. Normally you would add a layer of
on-disk-caching in such a scenario.
!!!

## Full React support

During this release cycle, we have moved to fully support the React handler,
including hydration, layouts, and liveview. For more information see the
[frontend frameworks](/modules/frontend) overview page.

This brings to 3 the number of frameworks we completely support: Svelte, React
and Solid.

## Build transformations

We've added a new configuration option, `build.transform`, having two
properties, `paths` and `mapper`. `paths` is a list of paths (glob patterns
are supported) for which the transformation should apply, and `mapper` is a
function that transforms the content of the files at the given paths. The
output of this function for each file is then copied onto the
`config.location.build` directory.

This is useful if you have placeholders for environment variables that you want
to replace in different files in your build.

```js
export default {
  build: {
    transform: {
	  paths: ["components/**/*.svelte"],
      mapper: content => content.replaceAll("%BASE%", "/"),
    },
  },
}
```

The above code will replace every occurrence of `"%BASE%"` in every Svelte
component under `components` and its subdirectories with `"/"` at build time.

!!!
Be careful with injecting secrets into components: components are rendered both
on the server and on the client, which means any secret you map onto a
component will be exposed to every client and can be considered compromised.
!!!

## Other changes

Consult the [full changelog][changelog] for a list of all relevant changes.

## Next on the road

After an extensive 0.21, this was a relatively small release with a fair amount
of internal changes in addition to the changes here listed.

Some of the things we plan to tackle in the upcoming weeks are,

* Add transactions to the PostgreSQL and MongoDB drivers
* Introduce IDE TypeScript support
* Add a `command` hook that would allow modules to register command line
  namespaces, to be able to run `npx primate [namespace] [command] [flags]`
* Use this new hook to create database migrations for SQL-flavored databases
* Extend `create-primate` with the ability to add new routes
* Add hydration and liveview support for `@primate/vue`
* Support the `multipart/form-data` content type
* Introduce a `Result` class as an alternative return value for store functions
* Flesh out stores with default values, additional predicates and relations
  between tables/collections
* Add more type variants

This list isn't exhaustive or binding. None, some or all of these features may
be included in 0.23, and other features may be prioritized according to
feedback.

## Fin

If you like Primate, consider [joining our channel #primate][irc] on
irc.libera.chat.

Otherwise, have a blast with the new version!

[Getting started]: /guide/getting-started
[irc]: https://web.libera.chat#primate
[changelog]: https://github.com/primate-run/primate/releases/tag/0.22.0
