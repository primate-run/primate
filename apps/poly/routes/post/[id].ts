import assert from "@rcompat/assert";
import int from "pema/int";
import view from "primate/response/view";
import route from "primate/route";

const posts = [{
  id: 1,
  title: "First post",
}];

route.get(request => {
  const _id = int.parse(+request.path.id!);
  const post = posts.find(({ id }) => id === _id);
  assert(post !== undefined);

  return view("ViewPost.poly", { post });
});
