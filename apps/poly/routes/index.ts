import route from "primate/route";
import view from "primate/view";

const posts = [{
  id: 1,
  title: "First post",
}];

route.get(() => view("Index.poly", { posts }));
