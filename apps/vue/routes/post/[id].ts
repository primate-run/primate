import assert from "@rcompat/assert";
import int from "pema/int";
import view from "primate/response/view";
import route from "primate/route";

const posts = [{
  id: 1,
  title: "First post",
}];

route.get(request => {
  const id = int.coerce.parse(request.path.try("id"));
  const post = posts.find(p => p.id === id);
  assert(post !== undefined);

  return view("ViewPost.vue", { post });
});
