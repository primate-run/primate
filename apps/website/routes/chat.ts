import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.redirect.external("https://discord.gg/RSg4NNwM4f", {
      allowedOrigins: ["https://discord.gg"],
    });
  },
});
