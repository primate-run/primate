import type Frontend from "@primate/core/Frontend";
import type Module from "@primate/core/frontend/Module";
import inline from "@primate/core/inline";

const script_re = /(?<=<script)>(?<code>.*?)(?=<\/script>)/gus;
const style_re = /(?<=<style)>(?<code>.*?)(?=<\/style>)/gus;
const remove = /<(?<tag>script|style)>.*?<\/\k<tag>>/gus;

type Handler = (m: Module) => Frontend;

const handler: Handler = m => (name, props = {}, options = {}) => async app => {
  const component = app.component(name);
  const rendered = await m.render(component, props);
  const { csp = {}, headers, ...rest } = options;
  const { script_src: xscript_src = [], style_src: xstyle_src = [] } = csp;
  const scripts = await Promise.all([...rendered.body.matchAll(script_re)]
    .flatMap(({ groups })=> groups?.code !== undefined
      ? inline(groups.code, "module")
      : [],
    ));
  const styles = await Promise.all([...rendered.body.matchAll(style_re)]
    .flatMap(({ groups })=> groups?.code !== undefined
      ? inline(groups.code, "style")
      : [],
    ));
  const style_src = styles.map(asset => asset.integrity).concat(xstyle_src);
  const script_src = scripts.map(asset => asset.integrity).concat(xscript_src);
  const head = [...scripts, ...styles].map(asset => asset.head).join("\n");

  return app.view({
    body: rendered.body.replaceAll(remove, () => ""),
    head: head,
    headers: {
      ...app.headers({ "style-src": style_src, "script-src": script_src }),
      ...headers,
    },
    ...rest,
  });
};

export default handler;
