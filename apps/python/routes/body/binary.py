from primate import Route


@Route.post
def handle_post(request):
    bin_data = request.body.binary()

    return {
        "type": bin_data.content_type or request.headers.try_get("content-type"),
        "size": bin_data.size,
        "head": bin_data.head(4),
    }
