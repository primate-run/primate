import route from "primate/route";
import response from "primate/response";

const posts = [{
  id: 1,
  title: "First post",
}];

route.get(() => response.view("post-index.htmx", { posts }));
