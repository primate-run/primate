import pema from "pema";
import string from "pema/string";
import route from "primate/route";

const Params = pema({ id: string.regex(/^\d+$/) });

route.get(request => {
  const { id } = request.path.as(Params); // id: string (digits only)
  return `User #${id}`;
});
