import response from "primate/response";
import route from "primate/route";

route.get(() => response.binary(new Blob(["data"]), {
  // set filename manually
  headers: { "Content-Disposition": "attachment; filename=data.bin" },
}));

