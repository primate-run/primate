import type Font from "#asset/Font";
import type Script from "#asset/Script";
import type Style from "#asset/Style";
import empty from "@rcompat/record/empty";
import type Dictionary from "@rcompat/type/Dictionary";

const attribute = (attributes: Dictionary<string>) => empty(attributes)
  ? ""
  : " ".concat(Object.entries(attributes)
    .map(([key, value]) => `${key}="${value}"`).join(" "))
  ;
const tag = (name: string, { attributes = {}, code = "", close = true }) =>
  `<${name}${attribute(attributes)}${close ? `>${code}</${name}>` : "/>"}`;
const nctag = (name: string, properties: Dictionary) =>
  tag(name, { ...properties, close: false });

export default {
  // inline: <script type integrity>...</script>
  // outline: <script type integrity src></script>
  script({ inline, code, type, integrity, src, id }: Script) {
    return inline
      ? id === undefined
        ? tag("script", { attributes: { type, integrity }, code })
        : tag("script", { attributes: { type, integrity, id }, code })
      : tag("script", { attributes: { type, integrity, src } });
  },
  // inline: <style>...</style>
  // outline: <link rel="stylesheet" href />
  style({ inline, code, href }: Style) {
    return inline
      ? tag("style", { code })
      : nctag("link", { attributes: { rel: "stylesheet", href } });
  },
  font({ href, rel = "preload", as = "font", type, crossorigin = "true" }: Font) {
    return nctag("link", { attributes: { rel, href, as, type, crossorigin } });
  },
};
