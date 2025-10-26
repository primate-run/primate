import p from "pema";
import route from "primate/route";

route.post(request => {
  const { name } = request.body.json(p({ name: p.string.min(1) }));

  return `Hello, ${name}`;
});
