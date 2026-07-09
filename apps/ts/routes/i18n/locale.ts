import app from "@/config/app";
import route from "primate/route";

export default route({
  get() {
    return app.i18n.locale.get();
  },
});
