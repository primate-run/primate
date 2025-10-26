import response from "primate/response";
import route from "primate/route";

route.get(() => {
  let timer: ReturnType<typeof setInterval>;
  const start = Date.now();

  return response.sse({
    close() {
      clearInterval(timer);
    },
    open(source) {
      timer = setInterval(() => {
        source.send("passed", Math.floor((Date.now() - start) / 1000));
      }, 5000); // every 5s
    },
  });
});
