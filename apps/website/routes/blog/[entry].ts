import BlogEntryStore from "#store/BlogEntry";
import BlogEntry from "#view/BlogEntry";
import response from "primate/response";
import route from "primate/route";

export default route({
  async get(request) {
    const entry = request.path.get("entry");
    const { html, frontmatter } = await BlogEntryStore.get(entry);

    return response.view(BlogEntry, {
      content: html,
      meta: frontmatter,
    });
  },
});
