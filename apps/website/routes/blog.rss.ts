import BlogEntryStore from "#store/BlogEntry";
import http from "@rcompat/http";
import response from "primate/response";
import route from "primate/route";

const description = "The universal web framework";
const blog_base = "https://primate.run/blog";

export default route({
  async get() {
    const blog_posts = (await BlogEntryStore.find())
      .map(post => ({
        link: `${blog_base}/${post.id}`,
        title: post.frontmatter.title,
        description: post.frontmatter.title,
      }));

    const props = { description, entries: blog_posts };
    const options = {
      headers: { "Content-Type": http.MIME.APPLICATION_XML },
      partial: true,
    };

    return response.view("blog.rss.html", props, options);
  },
});
