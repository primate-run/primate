from primate import Route


@Route.get
def handle_get(request):
    if request.query.has("foo"):
        return request.query.get("foo")
    else:
        return "foo missing"
