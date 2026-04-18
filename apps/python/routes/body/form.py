from primate import Route


@Route.post(content_type="application/x-www-form-urlencoded")
def handle_post(request):
    return request.body.form()
