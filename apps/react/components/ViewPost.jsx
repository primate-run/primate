import t from "@primate/react/i18n";

export default ({ post }) => {
  return <>
    <h1>{t("Title")}: {post.title}</h1>
    <div>Id: {post.id}</div>
  </>
}
