from primate import Route


@Route.get
def get(request):
    return "Redirected!"
