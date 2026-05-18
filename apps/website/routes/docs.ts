import DocPage from "#store/DocPage";
import Static from "#view/Static";
import response from "primate/response";
import route from "primate/route";

export default route({
  async get(request) {
    const { html, toc } = await DocPage.get("index");

    const props = {
      content: html,
      path: "/" + request.url.pathname.slice("/docs/".length),
      toc,
    };

    return response.view(Static, props, {
      placeholders: request.get("placeholders"),
    });
  },
});
