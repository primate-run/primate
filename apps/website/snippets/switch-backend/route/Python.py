from primate import Route, Response

@Route.get
def get(request):
    return Response.page({"start": 10})
