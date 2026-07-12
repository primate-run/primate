import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    const start = Date.now();

    return response.sse(source => {
      const timer = setInterval(() => {
        source.send("passed", Math.floor((Date.now() - start) / 1000));
      }, 5000); // every 5s

      return () => clearInterval(timer);
    });
  },
});
