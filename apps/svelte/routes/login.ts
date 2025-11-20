import LoginForm from "#view/LoginForm";
import p from "pema";
import response from "primate/response";
import route from "primate/route";

const LoginSchema = p({
  email: p.string.email(),
  password: p.string.min(8),
});

route.get(() => response.view(LoginForm));

route.post(request => {
  const body = request.body.json(LoginSchema);

  console.log("Login attempt:", body.email);

  return null;
});
