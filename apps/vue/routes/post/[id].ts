import assert from "@rcompat/assert";
import int from "pema/int";
import response from "primate/response";
import route from "primate/route";

const posts = [{
  id: 1,
  title: "First post",
}];

route.get(request => {
  const id = int.coerce.parse(request.path.try("id"));
  const post = posts.find(p => p.id === id);
  assert(post !== undefined);

  return response.view("ViewPost.vue", { post });
});
