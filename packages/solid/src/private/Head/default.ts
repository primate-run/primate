import HeadContext from "#context/head";
import type Dict from "@rcompat/type/Dict";
import { useContext } from "solid-js";

type Child = {
  t: string;
  tagName: string;
  props: Dict;
};

const data_attribute = "data-sh";
const data_ssr = "ssr";
const allowed = ["title", "meta", "style", "meta", "link", "script", "base"];

const make_tag = (tag: string, id: string) => {
  const parts = tag.split(" ");
  return [
    parts[0],
    `${data_attribute}="${id}"`,
    ...parts.slice(1),
  ].join(" ");
};

const get_tag = (child: string) => child.match(/^<(?<tag>[a-z]*) .*$/u)?.groups?.tag ?? "";

const render = (children: Child[], id: string) => {
  const tags = children.map(({ t: tag }) => tag);
  const all_good = tags.every(tag => allowed.includes(get_tag(tag)));
  if (!all_good) {
    const bad = get_tag(tags.find(tag => !allowed.includes(get_tag(tag))) ?? "");
    const alloweds = `${allowed.map(tag => `<${tag}>`).join(", ")}`;
    const error = `Head may only contain ${alloweds}, found <${bad}>`;
    throw new Error(error);
  }

  const titles = tags.filter(tag => get_tag(tag) === "title");
  const others = tags.filter(tag => get_tag(tag) !== "title");

  return [
    ...titles,
    ...others.map(other => make_tag(other, id)),
  ];
};

const clear = (data_value: string) => {
  const selector = `[${data_attribute}="${data_value}"]`;
  globalThis.document.querySelectorAll(selector).forEach(element => {
    element.remove();
  });
};

const Head = function Head(props: { children: Child[] }) {
  const context = useContext(HeadContext) as ((input: string[]) => void);
  context(render(props.children, data_ssr));

  // no return, nothing rendered
};

Head.clear = (data_value = data_ssr) => clear(data_value);

export default Head;
