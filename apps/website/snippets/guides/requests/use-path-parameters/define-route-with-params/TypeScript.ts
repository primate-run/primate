import route from "primate/route";

route.get(request => {
  const id = request.path.get("id");
  return { id };
});
