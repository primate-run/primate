import type { Init } from "@primate/core/frontend";
import transform_html from "@primate/html/transform";
import error from "@rcompat/error";
import p from "pema";

function could_not_find_app_js_in_assets() {
  return error.template`could not find app.js in assets`;
}

const errors = error.coded({
  could_not_find_app_js_in_assets,
});

const CLIENT_SIDE_TEMPLATE_ENGINES = [
  "mustache",
  "handlebars",
  "nunjucks",
] as const;

const schema = p({
  clientSideTemplates: p({
    engine: p.enum(CLIENT_SIDE_TEMPLATE_ENGINES),
  }).optional(),
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

    if (app_js === undefined) throw errors.could_not_find_app_js_in_assets();

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
