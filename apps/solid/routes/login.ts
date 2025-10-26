import pema from "pema";
import string from "pema/string";
import response from "primate/response";
import route from "primate/route";

const LoginSchema = pema({
  email: string.email(),
  password: string.min(8),
});

route.get(() => response.view("LoginForm.tsx"));

route.post(request => {
  const body = request.body.json(LoginSchema);

  console.log("Login attempt:", body.email);

  return null;
});
