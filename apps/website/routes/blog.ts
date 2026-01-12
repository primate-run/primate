import type Component from "@primate/markdown/Component";
import views from "app:views";
import response from "primate/response";
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
    const blog_posts =
      views.map(([a]) => a).filter(a => a.startsWith("content/blog"));
    const posts = blog_posts
      .map(post => ({
        href: post.slice(base.length + 1),
        ...app.loadView<Post>(`${post}.md`),
        md: "",
      }))
      .toSorted((a, b) => a.meta.epoch < b.meta.epoch ? 1 : - 1)
      ;
    const config = request.config;
    return response.view("Blog.svelte", { app: config, posts }, {
      placeholders: request.placeholders,
    })(app, {}, request);
  };
});;
