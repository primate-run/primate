route.post(request =>
  request.forward("https://api.example.com", { "X-Custom": "value" }));