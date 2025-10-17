import type Module from "@primate/core/frontend/Module";
import type ViewResponse from "@primate/core/frontend/ViewResponse";
import inline from "@primate/core/inline";

const SCRIPT = /(?<=<script)>(?<code>.*?)(?=<\/script>)/gus;
const STYLE = /(?<=<style)>(?<code>.*?)(?=<\/style>)/gus;
const REMOVE = /<(?<tag>script|style)>.*?<\/\k<tag>>/gus;

export default function response(m: Module): ViewResponse {
  return (name, props = {}, options = {}) => async app => {
    const view = app.loadView(name);
    const rendered = await m.render(view, props);
    const { csp = {}, headers, ...rest } = options;
    const { script_src: xScriptSrc = [], style_src: xStyleSrc = [] } = csp;
    const scripts = await Promise.all([...rendered.body.matchAll(SCRIPT)]
      .flatMap(({ groups }) => groups?.code !== undefined
        ? inline(groups.code, "module")
        : [],
      ));
    const styles = await Promise.all([...rendered.body.matchAll(STYLE)]
      .flatMap(({ groups }) => groups?.code !== undefined
        ? inline(groups.code, "style")
        : [],
      ));
    const styleSrc = styles.map(asset => asset.integrity).concat(xStyleSrc);
    const scriptSrc = scripts.map(asset => asset.integrity).concat(xScriptSrc);
    const head = [...scripts, ...styles].map(asset => asset.head).join("\n");

    return app.view({
      body: rendered.body.replaceAll(REMOVE, () => ""),
      head: head,
      headers: {
        ...app.headers({ "script-src": scriptSrc, "style-src": styleSrc }),
        ...headers,
      },
      ...rest,
    });
  };
}
