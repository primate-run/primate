import pema from "pema";
import string from "pema/string";
import response from "primate/response";
import Status from "primate/response/Status";
import route from "primate/route";

route.post(request => {
  const { name } = request.body.fields(pema({ name: string.optional() }));

  if (name === undefined) {
    return response.text("No name specified", {
      status: Status.UNPROCESSABLE_ENTITY,
    });
  }

  return response.text(`Name '${name}' submitted`, { status: Status.CREATED });
});
