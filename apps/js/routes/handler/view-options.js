import view from "primate/view";

export default {
  get() {
    return view("index.html", { hello: "world" }, { partial: true });
  },
};
