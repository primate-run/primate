import p from "pema";
import route from "primate/route";

const Schema = p(({
  text: p.string,
  title: p.string,
}));

export default route({
  async post(request) {
    const { text, title } = Schema.parse(await request.body.form());

    return `<h2>Adding a post with:</h2>
    <div><strong>Title</strong> ${title}</div>
    <div><strong>Text</strong> ${text}</div>`;
  },
});
