import GuideStore from "#store/Guide";
import HomeSectionStore from "#store/HomeSection";
import Index from "#view/Index";
import response from "primate/response";
import route from "primate/route";

const example_names = ["backend", "frontend", "runtime", "i18n"];

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
  async get(request) {
    const examples = Object.fromEntries(await Promise.all(example_names
      .map(async section => [
        section,
        (await HomeSectionStore.get(section)).html,
      ])));

    const guides = await guide_list();
    const props = { examples, guides };
    const options = { placeholders: request.get("placeholders") };

    return response.view(Index, props, options);
  },
});
