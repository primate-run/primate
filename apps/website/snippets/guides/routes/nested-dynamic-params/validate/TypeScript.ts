import route from "primate/route";

route.get(req => {
  const id = Number(req.path.get("id"));
  if (Number.isNaN(id)) return new Response("Invalid id", { status: 400 });
  return { id, post: req.path.get("post") };
});
