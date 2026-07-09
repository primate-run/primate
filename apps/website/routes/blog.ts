import app from "@/config/app";
import Blog from "@/views/Blog";
import type { Component } from "@primate/markdown";
import response from "primate/response";
import route from "primate/route";

const base = "docs/blog";

type Post = {
  meta: {
    epoch: number;
    href: string;
  };
} & Component;

function to_excerpt(html: string) {
  const end = html.indexOf("</p>");
  return html.slice(0, end + "</p>".length);
};

export default route({
  async get() {
    const posts = app.views.entries().reduce((acc: {
      href: string;
      html_excerpt: string;
      meta: Post["meta"];
    }[], [postPath]) => {
      if (!postPath.startsWith("docs/blog")) return acc;
      const post = {
        href: postPath.slice(base.length + 1),
        ...app.views.get<Post>(`${postPath}.md`),
      };
      acc.push({
        href: post.href,
        meta: post.meta,
        html_excerpt: to_excerpt(post.html),
      });
      return acc;
    }, []).toSorted((a, b) => (a.meta.epoch < b.meta.epoch ? 1 : -1));

    return response.view(Blog, { posts });
  },
});
