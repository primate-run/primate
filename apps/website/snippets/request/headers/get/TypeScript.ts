import route from "primate/route";

export default route({
  get(request) {
    const ua = request.headers.try("user-agent"); // may be undefined
    const contentType = request.headers.try("content-type");

    // returned as JSON
    return { ua, contentType };
  },
});
