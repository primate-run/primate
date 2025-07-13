import assert from "@rcompat/assert";
import int from "pema/int";
import route from "primate/route";
import view from "primate/view";

const posts = [{
  id: 1,
  title: "First post",
}];

export default route({
  get(request) {
    const _id = int.validate(+request.path.id!);
    const post = posts.find(({ id }) => id === _id);
    assert(post !== undefined);

    return view("ViewPost.jsx", { post });
  },
});
