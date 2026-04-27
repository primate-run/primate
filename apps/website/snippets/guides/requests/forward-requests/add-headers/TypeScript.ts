export default route({
  post(request) {
    return request.forward("https://api.example.com", { "X-Custom": "value" });
  },
});
