import Index from "#view/Index";
import response from "primate/response";
import route from "primate/route";

const posts = [{
  id: 1,
  title: "First post",
}];

route.get(() => {
  return response.view(Index, { posts, title: "Test" });
});
