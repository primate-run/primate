export default ({ post: { id, title } }) =>
  <h2><a href={`/post/${id}`}>{title}</a></h2>;
