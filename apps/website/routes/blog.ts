import BlogEntryStore from "#store/BlogEntry";
import Blog from "#view/Blog";
import response from "primate/response";
import route from "primate/route";

function to_excerpt(html: string) {
  const end = html.indexOf("</p>");
  return html.slice(0, end + "</p>".length);
};

export default route({
  async get(request) {
    const posts = (await BlogEntryStore.find())
      .map(post => ({
        href: post.id,
        html_excerpt: to_excerpt(post.html),
        meta: post.frontmatter,
        md: "",
      }))
      .toSorted((a, b) => a.meta.epoch < b.meta.epoch ? 1 : -1);

    return response.view(Blog, { posts });
  },
});
