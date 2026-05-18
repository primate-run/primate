import DocPage from "#store/DocPage";
import Static from "#view/Static";
import response from "primate/response";
import route from "primate/route";

export default route({
  async get(request) {
    const page = request.path.get("page");
    const markdown = page.endsWith(".md");
    const id = markdown ? page.slice(0, -".md".length) : page;

    const { html, toc, body } = await DocPage.get(id);

    if (markdown) return response.text(body);

    const props = {
      content: html,
      path: "/" + request.url.pathname.slice("/docs/".length),
      toc,
    };

    return response.view(Static, props);
  },
});
