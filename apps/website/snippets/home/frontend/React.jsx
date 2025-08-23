export default function Index({ posts }) {
  return <>
    <h1>All posts</h1>
    {posts.map(post => (
      <h2 key={post.id}>
        <a href={`/post/${post.id}`}>
          {post.title}
        </a>
      </h2>
    ))}
  </>;
};
