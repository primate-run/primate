import response from "primate/response";
import route from "primate/route";

const posts = [{
  id: 1,
  title: "First post",
}];

export default route({
  get() {
    return response.view("Index.jsx", { posts });
  },
});
