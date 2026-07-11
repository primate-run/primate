import type route from "./props-type";

export default function PropsType(props: typeof route.get.Page) {
  return <span id="result">{props.message}</span>;
}
