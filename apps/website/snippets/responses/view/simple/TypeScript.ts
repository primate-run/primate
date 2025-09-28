import response from "primate/response";
import route from "primate/route";

// render components/Counter.jsx, embed in pages/app.html and serve
route.get(() => response.view("Counter.jsx"));
