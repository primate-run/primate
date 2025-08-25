import error from "primate/response/error";
import route from "primate/route";

// use pages/custom-error.html instead of pages/error.html
route.get(() => error({ page: "custom-error.html" }));
