import frontends from "../lib/frontends.ts";

export default function SolidPage(props) {
  return <main>
    <h1 id="current">{props.current}</h1>
    <nav>{frontends.map(frontend =>
      <a id={`to-${frontend.name}`} href={`/${frontend.name}`}>{frontend.name}</a>
    )}</nav>
  </main>;
}
