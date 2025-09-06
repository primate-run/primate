import type Child from "#Head/ClientChild";
import { onCleanup, onMount } from "solid-js";

const data_attribute = "data-sh";
const data_ssr = "ssr";

const render = (children: Child[], id: string) => {
  // DOM elements
  const titles = children.filter(({ tagName }) => tagName === "TITLE");
  const others = children.filter(({ tagName }) => tagName !== "TITLE");

  titles.forEach(title => {
    globalThis.document.title = title.innerText;
  });
  others.forEach(other => {
    other.dataset.sh = id;
    globalThis.document.head.prepend(other);
  });
};

const clear = (data_value: string) => {
  const selector = `[${data_attribute}="${data_value}"]`;
  globalThis.document.querySelectorAll(selector).forEach(element => {
    element.remove();
  });
};

const Head = function Head(props: { children: Child[] }) {
  let id: string;
  onMount(() => {
    id = crypto.randomUUID();
    render(props.children, id);
  });

  onCleanup(() => {
    // remove managed tags
    clear(id);
  });

  return null;
};

Head.clear = (data_value = data_ssr) => clear(data_value);

export default Head;
