import route from "primate/route";

export default route({
  get(request) {
    const id = request.path.get("id");
    const postId = request.path.get("post_id");
    return { id, postId };
  },
});
