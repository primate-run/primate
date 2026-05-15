import Props from "#view/Props";
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view(Props, { foo: "bar" });
  },
});
