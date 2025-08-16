import pema from "pema";
import string from "pema/string";
import route from "primate/route";

route.post(request => {
  const { text, title } = request.body.fields(pema({
    text: string,
    title: string,
  }));

  return `<h2>Adding a post with:</h2>
    <div><strong>Title</strong> ${title}</div>
    <div><strong>Text</strong> ${text}</div>`;
});
