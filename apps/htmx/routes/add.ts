import route from "primate/route";
import pema from "pema";
import string from "pema/string";

route.post(request => {
  const { title, text } = pema({
    title: string,
    text: string,
  }).validate(request.body);

  return `<h2>Adding a post with:</h2>
    <div><strong>Title</strong> ${title}</div>
    <div><strong>Text</strong> ${text}</div>`;
});
