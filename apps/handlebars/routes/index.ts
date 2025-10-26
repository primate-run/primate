import response from "primate/response";
import route from "primate/route";

const posts = [{
  id: 1,
  title: "First post",
}];

route.get(() => response.view("Index.hbs", { posts }));
