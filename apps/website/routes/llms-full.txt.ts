import views from "app:views";
import route from "primate/route";

const base = "https://primate.run";
const names = views
  .filter(name => name[0].startsWith("docs/docs")
    || name[0].startsWith("docs/guides"))
  .map(view => {
    const source = `${base}/${view[0].slice("docs/".length)}`;
    return `Source: ${source}${(view[1] as any).default.md}`;
  }).join("\n\n\n");

route.get(() => names);
