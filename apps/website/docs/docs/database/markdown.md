---
title: Markdown database
---

# Markdown

Primate reads Markdown files from the filesystem as a structured store, with
frontmatter parsing, HTML rendering, and table of contents generation built in.

Primate uses `marked` to compile Markdown to HTML.

## Setup

### Install

```bash
npm install @primate/markdown
```

### Configure

Create a database instance pointing at your docs directory.

```ts
// config/db.ts
import markdown from "@primate/markdown";

export default markdown({
  driver: "file",
  directory: "docs",
});
```

## Stores

Define a store by calling `markdown.store()` with a `db` instance, a
subdirectory within the database root, and a frontmatter schema.

```ts
// stores/BlogEntry.ts
import db from "#config/db";
import markdown from "@primate/markdown";
import p from "pema";

export default markdown.store({
  db,
  directory: "blog",
  frontmatter: p.loose({
    title: p.string,
    epoch: p.number,
    author: p.string,
    published: p.boolean.default(false),
  }),
});
```

Each `.md` file under `docs/blog/` becomes a document whose `id` is its path
relative to that directory, without the `.md` extension.

## Reading documents

### get

Fetch a single document by id. Throws if the document does not exist.

```ts
// routes/blog/[entry].ts
import BlogEntry from "#store/BlogEntry";
import BlogEntryView from "#view/BlogEntry";
import response from "primate/response";
import route from "primate/route";

export default route({
  async get(request) {
    const entry = request.path.get("entry");
    const { html, frontmatter } = await BlogEntry.get(entry);

    return response.view(BlogEntryView, { html, frontmatter });
  },
});
```

### try

Like `get`, but returns `undefined` instead of throwing when the document is
not found.

### find

Return all documents in the store, sorted by id.

```ts
// routes/blog.ts
import BlogEntry from "#store/BlogEntry";
import Blog from "#view/Blog";
import response from "primate/response";
import route from "primate/route";

export default route({
  async get(request) {
    const posts = (await BlogEntry.find())
      .toSorted((a, b) => a.frontmatter.epoch < b.frontmatter.epoch ? 1 : -1);

    return response.view(Blog, { posts });
  },
});
```

## Document shape

Every document returned by `get`, `try`, or `find` has the following fields.

| field         | type       | description                                    |
| ------------- | ---------- | ---------------------------------------------- |
| `id`          | `string`   | Path relative to the store directory, no `.md` |
| `body`        | `string`   | Raw Markdown source, after frontmatter is stripped |
| `html`        | `string`   | Rendered HTML                                  |
| `toc`         | `TOCItem[]`| Headings extracted from the document           |
| `frontmatter` | `T`        | Parsed and validated frontmatter               |

Each `TOCItem` has `depth`, `slug`, and `text`.

## Options

| option         | type              | default      | description                          |
| -------------- | ----------------- | ------------ | ------------------------------------ |
| `driver`       | `"file"`          | —            | Storage driver (currently `"file"`)  |
| `directory`    | `string`          | —            | Root directory for Markdown files    |
| `marked`       | `MarkedExtension` | `{}`         | Options passed to `marked`           |
| `pretransform` | `Pretransform`    | `text => text` | Transform source before parsing    |

## Resource

- [Marked documentation](https://marked.js.org)
