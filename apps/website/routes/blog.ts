import app from "#app";
import Blog from "#view/Blog";
import type { Component } from "@primate/markdown";
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

const to_excerpt = (html: string) => {
  const end = html.indexOf("</p>");
  return html.slice(0, end + "</p>".length);
}

export default route({
  async get(request) {
    const posts = views.reduce((acc: {
      href: string,
      html_excerpt: string,
      meta: Post["meta"],
    }[], [postPath]) => {
      if (!postPath.startsWith("docs/blog")) return acc;
      const post = {
        href: postPath.slice(base.length + 1),
        ...app.view<Post>(`${postPath}.md`),
      };
      acc.push({
        href: post.href,
        html_excerpt: to_excerpt(post.html),
        meta: post.meta,
      });
      return acc;
    }, []).sort((a, b) => (a.meta.epoch < b.meta.epoch ? 1 : -1));
    return response.view(Blog, { posts }, {
      placeholders: request.get("placeholders"),
    });
  },
});
