import route from "primate/route";
import view from "primate/response/view";
import pema from "pema";
import string from "pema/string";

const LoginSchema = pema({
  email: string.email,
  password: string.min(8),
});

route.get(() => view("LoginForm.tsx"));

route.post(async request => {
  const body = await request.body.json(LoginSchema);

  console.log("Login attempt:", (body as any).email);

  return null;
});