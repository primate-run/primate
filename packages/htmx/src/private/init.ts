import fail from "@primate/core/fail";
import type { Init } from "@primate/core/frontend";
import transform_html from "@primate/html/transform";
import p from "pema";

const TEMPLATES = ["handlebars", "mustache", "nunjucks", "xslt"] as const;
const schema = p({
  htmxExtensions: p.array(p.string).default([]),
  templates: p.array(p.enum(TEMPLATES)).unique().default([]),
});

const init: Init<any, typeof schema> = {
  name: "htmx",
  extensions: [".htmx"],
  layouts: false,
  client: false,
  conditions: [],
  schema,

  async transform({ body, head = "", headers = {}, app, options, request }) {
    const base = await transform_html({
      body,
      head,
      headers,
      app,
      options,
      request,
    });

    const app_js = app.assets.find(({ src }) =>
      src !== undefined && src.includes("app") && src.endsWith(".js"),
    );

    if (app_js === undefined) throw fail`could not find app.js in assets`;

    const script = `<script type="module" src="${app_js.src}"></script>`;

    return {
      body: base.body,
      head: (base.head ?? "").concat(script),
      headers: base.headers,
      partial: Boolean(request.headers.try("hx-request")),
    };
  },
};

export default init;
