import type route from "./index";

export default function Page(props: typeof route.get.Page) {
  return <h1>{props.message}</h1>;
}
