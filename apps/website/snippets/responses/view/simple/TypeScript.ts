import view from "primate/response/view";
import route from "primate/route";

// render components/Counter.jsx, embed in pages/app.html and serve
route.get(() => view("Counter.jsx"));
