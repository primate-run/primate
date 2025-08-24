import pema from "pema";
import string from "pema/string";
import Status from "primate/response/Status";
import text from "primate/response/text";
import route from "primate/route";

route.post(request => {
  const { name } = request.body.fields(pema({ name: string.optional() }));

  if (name === undefined) {
    return text("No name specified", { status: Status.UNPROCESSABLE_ENTITY });
  }

  return text(`Name '${name}' submitted`, { status: Status.CREATED });
});
