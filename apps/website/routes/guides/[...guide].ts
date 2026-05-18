import GuideStore from "#store/Guide";
import Guide from "#view/Guide";
import response from "primate/response";
import route from "primate/route";

export default route({
  async get(request) {
    const guide = request.path.get("guide");
    const { html, frontmatter } = await GuideStore.get(guide);

    const props = {
      category: guide.split("/")[0],
      content: html,
      meta: frontmatter,
    };

    return response.view(Guide, props, {
      placeholders: request.get("placeholders"),
    });
  },
});
