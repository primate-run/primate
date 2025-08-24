import pema from "pema";
import string from "pema/string";
import route from "primate/route";

route.get(request => {
  const { name } = request.body.fields(pema({ name: string }));

  return `Name '${name}' submitted`;
});

