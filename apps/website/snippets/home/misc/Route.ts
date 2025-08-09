import Post from "#store/Post";
import route from "primate/route";
import view from "primate/view";

route.get(async () => view("Posts.jsx", {
  posts: await Post.find({}, { limit: 10 }),
}));
