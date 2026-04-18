from primate import Route


@Route.post(content_type="text/plain")
def handle_post(request):
    return request.body.text()
