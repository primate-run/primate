import type FileRef from "@rcompat/fs/FileRef";

export default (_: string, file: FileRef) => {
  if (file.name.includes("Store")) {
    return "stores/Post.ts";
  }
  if (file.name.includes("Route")) {
    return "routes/posts.ts";
  }
  return "component/Posts.jsx";
};
