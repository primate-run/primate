import app from "@/config/app";
import route from "primate/route";
export default route({
  get() {
    return app.i18n.with("de")("welcome", { name: "John", count: 5 });
  },
});
