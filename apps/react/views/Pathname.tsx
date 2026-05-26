import { useRequest } from "app:react";

export default function Pathname() {
  const request = useRequest();

  return <>
    <span id="pathname">{request.url.pathname}</span>
    <a id="next" href="/pathnamed">next</a>
  </>;
}
