from primate import Route


@Route.get
def get(request):
    return "Hello from Python"


@Route.post
def post(request):
    return {"ok": True}
