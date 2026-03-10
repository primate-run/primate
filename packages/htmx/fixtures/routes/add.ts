import p from "pema";
import route from "primate/route";

route.post(request => {
  const { text, title } = request.body.form(p({
    text: p.string,
    title: p.string,
  }));

  return `<h2>Adding a post with:</h2>
    <div><strong>Title</strong> ${title}</div>
    <div><strong>Text</strong> ${text}</div>`;
});
