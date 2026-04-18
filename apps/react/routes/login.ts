import LoginForm from "#view/LoginForm";
import p from "pema";
import response from "primate/response";
import route from "primate/route";

const LoginSchema = p({
  email: p.string.email(),
  password: p.string.min(8),
});

export default route({
  get() {
    return response.view(LoginForm, {});
  },
  async post(request) {
    const body = LoginSchema.parse(await request.body.json());

    console.log("Login attempt:", body.email);

    return null;

  },
});
