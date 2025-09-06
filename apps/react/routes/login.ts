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

  // Here you would typically authenticate the user
  // For this example, we'll just log the credentials
  console.log("Login attempt:", (body as any).email);

  // In a real app, you'd check credentials against a database
  // and return appropriate response

  return null; // 204 No Content for successful login
});