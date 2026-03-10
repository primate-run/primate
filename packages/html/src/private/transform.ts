import type { Init } from "@primate/core/frontend";
import inline from "@primate/core/inline";

type Transform = Init["transform"];

const SCRIPT = /(?<=<script)>(?<code>.*?)(?=<\/script>)/gus;
const STYLE = /(?<=<style)>(?<code>.*?)(?=<\/style>)/gus;
const REMOVE = /<(?<tag>script|style)>.*?<\/\k<tag>>/gus;

const transform: NonNullable<Transform> = async ({ body, headers = {}, app, options }) => {
  const { style_src = [], script_src = [] } = options.csp ?? {};

  const scripts = await Promise.all(
    [...body.matchAll(SCRIPT)].flatMap(({ groups }) =>
      groups?.code !== undefined ? [inline(groups.code, "module")] : []),
  );

  const styles = await Promise.all(
    [...body.matchAll(STYLE)].flatMap(({ groups }) =>
      groups?.code !== undefined ? [inline(groups.code, "style")] : []),
  );

  const app_headers = {
    "style-src": styles.map(asset => asset.integrity).concat(style_src),
    "script_src": scripts.map(asset => asset.integrity).concat(script_src),
  };
  const head = [...scripts, ...styles].map(asset => asset.head).join("\n");

  const extra = Object.fromEntries(new Headers(options.headers ?? {}));

  return {
    body: body.replaceAll(REMOVE, () => ""),
    head,
    headers: {
      ...app.headers(app_headers),
      ...headers,
      ...extra,
    },
  };
};

export default transform;
