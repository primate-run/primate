from primate import Route


@Route.post(content_type="application/octet-stream")
def handle_post(request):
    blob = request.body.blob()
    return {
        "type": blob.content_type,
        "size": blob.size,
        "head": blob.head(4),
    }
