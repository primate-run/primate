import app from "@/config/app";
import Index from "@/views/Index";
import type { Component } from "@primate/markdown";
import response from "primate/response";
import route from "primate/route";

const example_names = ["backend", "frontend", "runtime", "i18n"];

export default route({
  async get() {
    const examples = Object.fromEntries(example_names.map(section => [
      section,
      app.views.get<Component>(`docs/home/${section}.md`).html]));

    const guides = await app.root.join("guides.json").json();
    const props = { examples, guides };

    return response.view(Index, props);
  },
});
