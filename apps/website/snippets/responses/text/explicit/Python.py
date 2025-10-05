from primate import Response, Route


@Route.post
def post(request):
    return Response.text("Hello from Python!", status=201)
