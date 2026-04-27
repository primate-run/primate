import Post from "#store/Post";
import response from "primate/response";
import route from "primate/route";

export default route({
  async get() {
    const posts = await Post.find({ limit: 10 });

    return response.view("Posts.jsx", { posts });
  },
});
