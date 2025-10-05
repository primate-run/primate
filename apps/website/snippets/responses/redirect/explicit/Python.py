from primate import Response, Route


@Route.get
def get(request):
    return Response.redirect("https://primate.run", 303)


@Route.post
def post(request):
    return Response.redirect("/login")
