from primate import Route


@Route.post
def handle_post(request):
    return request.body.form()
