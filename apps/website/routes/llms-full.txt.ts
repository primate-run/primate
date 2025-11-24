import views from "app:views";
import route from "primate/route";

const base = "https://primate.run";
const names = views
  .filter(name => name[0].startsWith("content/docs")
    || name[0].startsWith("content/guides"))
  .map(view => {
    const source = `${base}/${view[0].slice("content/".length)}`;
    return `Source: ${source}${view[1].default.md}`;
  }).join("\n\n\n");

route.get(() => names);
