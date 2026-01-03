import MIME from "@rcompat/http/mime";
import views from "app:views";
import response from "primate/response";
import route from "primate/route";

const description = "The universal web framework";
const base = "content/blog";
const blog_base = "https://primate.run/blog";

route.get(async () => {
  const blog_posts = views
    .filter(([a]) => a.startsWith(base))
    .map(([a, b]) => {
      const meta = b.default.meta;
      return {
        link: `${blog_base}/${a.slice(base.length + 1)}`,
        title: meta.title,
        description: meta.title,
      };
    });
  ;
  const props = { description, entries: blog_posts };
  const options = {
    headers: { "Content-Type": MIME.APPLICATION_XML },
    partial: true,
  };

  return response.view("blog.rss.hbs", props, options);
});
