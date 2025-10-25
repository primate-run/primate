import FileRef from "@rcompat/fs/FileRef";
import xml from "@rcompat/http/mime/extension/xml";
import response from "primate/response";
import route from "primate/route";

const description = "The universal web framework";

const entries_path = ["blog", "entries.json"];
const entries = new FileRef(import.meta.url).up(2).join(...entries_path);

route.get(async () => {
  const props = { description, entries: await entries.json() };
  const options = {
    headers: { "Content-Type": xml },
    partial: true,
  };

  return response.view("blog.rss.hbs", props, options);
});
