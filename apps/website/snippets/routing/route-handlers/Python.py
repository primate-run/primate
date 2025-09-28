from primate import Route


@Route.get
def get(request):
    return "Hello from GET!"


@Route.post
def post(request):
    return "Hello from POST!"
