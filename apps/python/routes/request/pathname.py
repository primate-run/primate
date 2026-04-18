from primate import Route


@Route.get
def handle_get(request):
    return request.url.pathname
