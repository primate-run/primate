import assert from "@rcompat/assert";
import p from "pema";
import response from "primate/response";
import route from "primate/route";

const posts = [{
  id: 1,
  title: "First post",
}];

export default route({
  get(request) {
    const id = p.int.coerce(request.path.try("id"));
    const post = assert.defined(posts.find(_post => _post.id === id));
    return response.view("ViewPost.component.ts", { post });
  },
});
