import route from "primate/route";

route.get(request => {
  const id = request.path.get("id");
  const postId = request.path.get("post_id");
  return { id, postId };
});