import grain from "@primate/grain";
import html from "@primate/html";

export default {
  modules: [html(), await grain()],
};
