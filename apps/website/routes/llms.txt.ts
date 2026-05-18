import DocPage from "#store/DocPage";
import GuideStore from "#store/Guide";
import route from "primate/route";

const base = "https://primate.run";

export default route({
  async get() {
    const docs = (await DocPage.find())
      .map(page =>
        `- [${page.frontmatter.title}](${base}/docs/${page.id}.md)`)
      .join("\n");

    const guides = (await GuideStore.find())
      .map(guide =>
        `- [${guide.frontmatter.title}](${base}/guides/${guide.id}.md)`)
      .join("\n");

    return `# Primate

## Docs

${docs}

## Guides

${guides}`;
  },
});
