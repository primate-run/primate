import route from "primate/route";

route.get(request => {
  const id = request.path.get("id"); // throws if missing
  const name = request.path.try("name"); // null if missing
  return { id, name };
});
