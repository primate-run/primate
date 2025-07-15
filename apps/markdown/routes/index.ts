import route from "primate/route";
import view from "primate/view";

export default route({
  get() {
    return view("PostIndex.md");
  },
});
