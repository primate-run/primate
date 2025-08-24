import pema from "pema";
import string from "pema/string";
import route from "primate/route";

route.post(request => {
  const { name } = request.body.json(pema({ name: string.min(1) }));

  return `Hello, ${name}`;
});
