import pema from "pema";
import string from "pema/string";
import route from "primate/route";

const Path = pema({ id: string.regex(/^\d+$/) });

route.get(request => {
  const { id } = request.path.parse(Path); // id: string (digits only)
  return `User #${id}`;
});
