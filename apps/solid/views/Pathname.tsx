import { request } from "app:solid";

export default function Pathname() {
  return <>
    <span id="pathname">{request().url.pathname}</span>
    <a id="next" href="/pathnamed">next</a>
  </>;
}
