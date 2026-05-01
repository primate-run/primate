from primate import Route


@Route.post(content_type="application/json")
def handle_post(request):
    return request.body.json()
