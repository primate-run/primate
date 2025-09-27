from primate import Response, Route


@Route.get
def get(request):
    return Response.error({"body": "Python error"})
