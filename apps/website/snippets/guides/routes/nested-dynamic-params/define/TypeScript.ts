import route from "primate/route";

route.get(request => {
  const id = request.path.get("id");
  const post = request.path.get("post");
  return `user ${id}, post ${post}`;
});
