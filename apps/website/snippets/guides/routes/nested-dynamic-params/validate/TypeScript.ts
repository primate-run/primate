import route from "primate/route";

route.get(request => {
  const id = Number(request.path.get("id"));
  if (Number.isNaN(id)) return new Response("Invalid id", { status: 400 });
  return { id, post: request.path.get("post") };
});
