import GuideStore from "#store/Guide";
import Guides from "#view/Guides";
import response from "primate/response";
import route from "primate/route";

async function guide_list() {
  const guides = await GuideStore.find();
  const categories = new Map<string, { name: string; path: string }[]>();

  for (const guide of guides) {
    const [category, ...rest] = guide.id.split("/");
    const path = rest.join("/");

    categories.set(category, (categories.get(category) ?? []).concat({
      name: guide.frontmatter.title,
      path,
    }));
  }

  return [...categories.entries()];
}

export default route({
  async get() {
    const guides = await guide_list();

    return response.view(Guides, { guides });
  },
});
