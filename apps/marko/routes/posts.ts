import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    const posts = [
      { title: "First Post", excerpt: "Introduction to Primate with Marko" },
      { title: "Second Post", excerpt: "Building reactive applications" },
    ];

    return response.view("PostIndex.marko", { title: "Blog", posts });
  },
});
