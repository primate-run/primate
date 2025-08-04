import type Post from "#component/Post";

export default ({ post }: { post: Post }) =>
  <h2><a href={`/post/${post.id}`}>{post.title}</a></h2>;
