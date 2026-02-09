import app from "#app";
import Blog from "#view/Blog";
import type Component from "@primate/markdown/Component";
import views from "app:views";
import response from "primate/response";
import route from "primate/route";

const base = "docs/blog";

type Post = {
  meta: {
    epoch: number;
    href: string;
  };
} & Component;

route.get(request => {
  const blog_posts = views
    .map(([a]) => a)
    .filter(a => a.startsWith("docs/blog"));
  const posts = blog_posts
    .map(post => ({
      href: post.slice(base.length + 1),
      ...app.view<Post>(`${post}.md`),
      md: "",
    }))
    .toSorted((a, b) => a.meta.epoch < b.meta.epoch ? 1 : - 1)
    ;
  return response.view(Blog, { posts }, {
    placeholders: request.get("placeholders"),
  });
});;
