import app from "@/config/app";
import type { Component } from "@primate/markdown";
import response from "primate/response";
import route from "primate/route";

const sections = ["backend", "frontend", "runtime", "i18n"];

export default route({
  async get() {
    return response.page({
      examples: Object.fromEntries(sections.map(section => [
        section,
        app.views.get<Component>(`docs/home/${section}.md`).html])),
      guides: await app.root.join("guides.json").json(),
    });
  },
});
