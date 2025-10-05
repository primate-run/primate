from primate import Response, Route


@Route.get
def get(request):
    return Response.view("Counter.jsx")
