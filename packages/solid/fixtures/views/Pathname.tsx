import { request } from "app:solid";

export default function Pathname() {
  return <span id="pathname">{request().url.pathname}</span>;
}
