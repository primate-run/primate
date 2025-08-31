import Post from "#store/Post";
import view from "primate/response/view";
import route from "primate/route";

route.get(async () => {
  const posts = await Post.find({}, { limit: 10 });

  return view("Posts.jsx", { posts });
});
