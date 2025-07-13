import route from "primate/route";
import view from "primate/view";

const posts = [{
  id: 1,
  title: "First post",
}];

export default route({
  get() {
    return view("Index.jsx", { posts });
  },
});
