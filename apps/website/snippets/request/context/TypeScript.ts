import response from "primate/response";
import route from "primate/route";

// Add data to the initial client context
route.get(request => {
  request.context.greeting = "Welcome!";
  request.context.env = "production";

  return response.view("Hello.jsx");
});
