import type route from "./[id]";

export default function Post(props: typeof route.get.Page) {
  return <h1>Post {props.id}</h1>;
}
