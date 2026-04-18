from primate import Route


@Route.post(content_type="multipart/form-data")
def handle_post(request):
    return request.body.multipart().form
