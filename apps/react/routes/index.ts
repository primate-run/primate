import view from "primate/response/view";
import route from "primate/route";

const posts = [{
  id: 1,
  title: "First post",
}];

route.get(() => view("Index.tsx", { posts }));
