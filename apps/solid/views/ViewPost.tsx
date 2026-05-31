import type Post from "#component/Post";
import t from "#lib/i18n";

export default ({ post }: { post: Post }) => <>
  <h1>{t("title")}: {post.title}</h1>
  <div>Id: {post.id}</div>
</>;
