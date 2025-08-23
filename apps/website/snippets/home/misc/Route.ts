import Post from "#store/Post";
import view from "primate/response/view";
import route from "primate/route";

route.get(async () => view("Posts.jsx", {
  posts: await Post.find({}, { limit: 10 }),
}));
