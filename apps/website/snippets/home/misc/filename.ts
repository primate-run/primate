import type FileRef from "@rcompat/fs/FileRef";

export default (file: FileRef) => {
  if (file.name.includes("Store")) return "stores/Post.ts";
  if (file.name.includes("Route")) return "routes/posts.ts";
  return "components/Posts.jsx";
};
