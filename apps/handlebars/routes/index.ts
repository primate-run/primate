import view from "primate/view";

const posts = [{
  id: 1,
  title: "First post",
}];

export default {
  get() {
     return view("Index.hbs", { posts });
  },
};
