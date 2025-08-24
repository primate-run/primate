import binary from "primate/response/binary";
import route from "primate/route";

route.get(() => binary(new Blob(["data"]), {
  // set filename manually
  headers: { "Content-Disposition": "attachment; filename=data.bin" },
}));
