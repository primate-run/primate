import app from "#app";
import route from "primate/route";

export default route({
  get() {
    return app.i18n("foo.bar", { s: 4 });
  },
});
