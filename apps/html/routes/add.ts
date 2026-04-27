import p from "pema";
import route from "primate/route";

export default route({
  async post(request) {
    const { text, title } = p({
      text: p.string,
      title: p.string,
    }).parse(await request.body.form());

    return `<h2>Adding a post with:</h2>
      <div><strong>Title</strong> ${title}</div>
      <div><strong>Text</strong> ${text}</div>`;
  },
});
