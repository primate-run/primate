import DocPage from "#store/DocPage";
import GuideStore from "#store/Guide";
import route from "primate/route";

const base = "https://primate.run";

export default route({
  async get() {
    const docs = (await DocPage.find()).map(page => {
      const source = `${base}/docs/${page.id}`;
      return `Source: ${source}${page.body}`;
    });

    const guides = (await GuideStore.find()).map(guide => {
      const source = `${base}/guides/${guide.id}`;
      return `Source: ${source}${guide.body}`;
    });

    return [...docs, ...guides].join("\n\n\n");
  },
});
