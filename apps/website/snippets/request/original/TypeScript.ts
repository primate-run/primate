import route from "primate/route";

route.get(request => {
  // Abort handling if the client disconnects
  request.original.signal.addEventListener("abort", () => {
    console.log("client disconnected");
  });

  // Access a raw header
  const lang = request.original.headers.get("Accept-Language");
  return new Response(lang ?? "en-US");
});
