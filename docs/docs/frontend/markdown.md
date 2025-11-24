---
title: Markdown frontend
---

# Markdown

Primate runs [Markdown][Documentation] templates with server-side rendering,
frontmatter support, and table of contents generation.

Primate uses `marked` to compile Markdown to HTML.

## Setup

### Install

```bash
npm install @primate/markdown
```

### Configure

```ts
import config from "primate/config";
import markdown from "@primate/markdown";

export default config({
  modules: [markdown()],
});
```

## Templates

Create Markdown templates in `components` using standard Markdown syntax.

```md
<!-- components/post-index.md -->
# All Posts

Here are all the posts:

## First Post
Introduction to Primate

## Second Post
Building applications
```

Serve the template from a route:

```ts
// routes/posts.ts
import response from "primate/response";
import route from "primate/route";

route.get(() => response.view("post-index.md"));
```

## Frontmatter

Use YAML frontmatter to define metadata within your Markdown files.

```md
---
title: "My Blog Post"
author: "John Adams"
date: "2024-01-01"
published: true
---

# My Blog Post

By John Adams on 2024-01-01

This is the content of the post.
```

Serve the Markdown file:

```ts
// routes/blog.ts
import response from "primate/response";
import route from "primate/route";

route.get(() => response.view("blog-post.md"));
```

## Table of Contents

Markdown automatically generates a table of contents from headings within the
document.

```md
<!-- components/article.md -->
# Article Title

## Introduction

Some intro text.

## Main Content

More content.

## Conclusion

Final thoughts.
```

Serve the article:

```ts
// routes/article.ts
import response from "primate/response";
import route from "primate/route";

route.get(() => response.view("article.md"));
```

The rendered component includes `toc` data with heading information that can
be used to generate navigation.

### Using the Table of Contents

Access the `toc` data and frontmatter `meta` in your route to build navigation:

```ts
// routes/docs/[page].ts
import type Component from "@primate/markdown/Component";
import respone from "primate/response";
import route from "primate/route";

route.get(request => {
  const page = request.path.get("page");

  return app => {
    const { html, toc, meta } = app.component<Component>(`docs/${page}.md`);

    return response.view("DocPage.html", {
      content: html,
      toc,
      meta,
      title: meta.title || page,
    })(app, {}, request);
  };
});
```

Create an HTML component that uses the table of contents and metadata:

```html
<!-- components/DocPage.html -->
<div class="doc-layout">
  <header>
    <h1>${meta.title || title}</h1>
    ${meta.author ? `<p class="author">By ${meta.author}</p>` : ""}
    ${meta.date ? `<p class="date">${meta.date}</p>` : ""}
  </header>

  <nav class="toc">
    <h3>Table of Contents</h3>
    <ul>
      ${toc.map(item => `
        <li>
          <a href="#${item.slug}">${item.text}</a>
        </li>
      `).join("")}
    </ul>
  </nav>

  <main class="content">
    ${content}
  </main>
</div>
```

!!!
You must have `@primate/html` installed and configured in your `config/app.ts`,
or alternatively any other frontend for this.
!!!

## Configuration

| Option         | Type              | Default      | Description                |
| -------------- | ----------------- | ------------ | -------------------------- |
| fileExtensions | `string[]`        | `[".md"]`    | Associated file extensions |
| options        | `MarkedExtension` | `{}`         | `marked` options           |
| pretransform   | `Pretransform`    | `() => void` | Pretransform function      |

### Example

```ts
import markdown from "@primate/markdown";
import config from "primate/config";

export default config({
  modules: [
    markdown({
      // add `.markdown` to associated file extensions
      fileExtensions: [".md", ".markdown"],
    }),
  ],
});
```

## Resources

- [Documentation]
- [Marked documentation](https://marked.js.org)

[Documentation]: https://daringfireball.net/projects/markdown
