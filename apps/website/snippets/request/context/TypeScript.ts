import view from "primate/response/view";
import route from "primate/route";

// Add data to the initial client context
route.get(request => {
  request.context.greeting = "Welcome!";
  request.context.env = "production";

  return view("Hello.jsx");
});
