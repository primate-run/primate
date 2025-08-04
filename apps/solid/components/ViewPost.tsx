import type Post from "#component/Post";
import t from "@primate/solid/i18n";

export default ({ post }: { post: Post }) => <>
  <h1>{t("Title")}: {post.title}</h1>
  <div>Id: {post.id}</div>
</>;
