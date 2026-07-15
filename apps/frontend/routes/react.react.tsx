import route from "./react";
import frontends from "../lib/frontends.ts";

export default function ReactPage({ current }: typeof route.get.Page) {
  return <main>
    <h1 id="current">{current}</h1>
    <nav>{frontends.map(frontend =>
      <a id={`to-${frontend.name}`} href={`/${frontend.name}`}>{frontend.name}</a>
    )}</nav>
  </main>;
}
