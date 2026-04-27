import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.binary(new Blob(["data"]), {
      // set filename manually
      headers: { "Content-Disposition": "attachment; filename=data.bin" },
    });
  },
});
