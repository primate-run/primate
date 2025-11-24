import views from "app:views";
import route from "primate/route";

const base = "https://primate.run";
const names = views.map(view =>
  [view[0].slice("content/".length), view[1].default.meta?.title]);
const docs = names
  .filter(name => name[0].startsWith("docs"))
  .map(name => `- [${name[1]}](${base}/${name[0]}.md)`)
  .join("\n")
  ;
const guides = names
  .filter(name => name[0].startsWith("guides"))
  .map(name => `- [${name[1]}](${base}/${name[0]}.md)`)
  .join("\n")
  ;

route.get(() => {
  return `# Primate

## Docs

${docs}

## Guides

${guides}`;
});
