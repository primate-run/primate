import type Post from "@/components/Post";

export default ({ post }: { post: Post }) =>
  <h2><a href={`/post/${post.id}`}>{post.title}</a></h2>;
