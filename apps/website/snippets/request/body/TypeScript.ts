import p from "pema";
import route from "primate/route";

route.post(request => {
  const { name } = p({ name: p.string.min(1) }).parse(request.body.json());

  return `Hello, ${name}`;
});
