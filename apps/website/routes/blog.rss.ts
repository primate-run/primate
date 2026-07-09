import app from "@/config/app";
import http from "@rcompat/http";
import response from "primate/response";
import route from "primate/route";

const description = "The universal web framework";
const base = "docs/blog";
const blog_base = "https://primate.run/blog";

export default route({
  async get() {
    const blog_posts = app.views.entries()
      .filter(([a]) => a.startsWith(base))
      .map(([a, b]) => {
        const { meta } = b as { meta: { title: string } };
        return {
          link: `${blog_base}/${a.slice(base.length + 1)}`,
          title: meta.title,
          description: meta.title,
        };
      });
    ;

    const props = { description, entries: blog_posts };
    const options = {
      headers: { "Content-Type": http.MIME.APPLICATION_XML },
      partial: true,
    };

    return response.view("blog.rss.html", props, options);
  },
});
