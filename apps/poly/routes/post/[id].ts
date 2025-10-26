import assert from "@rcompat/assert";
import p from "pema";
import response from "primate/response";
import route from "primate/route";

const posts = [{
  id: 1,
  title: "First post",
}];

route.get(request => {
  const _id = p.int.parse(request.path.get("id"));
  const post = posts.find(({ id }) => id === _id);
  assert(post !== undefined);

  return response.view("ViewPost.poly", { post });
});
