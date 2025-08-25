import type Component from "@primate/markdown/Component";
import view from "primate/response/view";
import route from "primate/route";

const base = "content/blog";

type Post = {
  meta: {
    epoch: number;
    href: string;
  };
} & Component;

route.get(request => {
  return async app => {
    const directory = app.root.join(`components/${base}`);
    const posts = (await directory.collect())
      .map(post => ({
        href: post.base,
        ...app.component<Post>(`${base}/${post.base}.md`),
      }))
      .toSorted((a, b) => a.meta.epoch < b.meta.epoch ? 1 : - 1);
    const config = request.config;
    return view("Blog.svelte", { app: config, posts }, {
      placeholders: request.placeholders,
    })(app, {}, request);
  };
});;
