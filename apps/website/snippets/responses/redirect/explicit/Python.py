from primate import Response, Route


@Route.get
def get(request):
    return Response.redirect("/account")


@Route.post
def post(request):
    return Response.redirect("/login", 303)
