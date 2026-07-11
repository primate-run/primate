import type route from "./index";

export default function Page(props: typeof route.get.Page) {
  return <span id="result">{props.message}</span>;
}
