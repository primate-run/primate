import route from "primate/route";

route.get((request) => {
  const name = request.path.try("name") ?? "guest";
  return { name };
});
