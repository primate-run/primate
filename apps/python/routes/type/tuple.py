from primate import Route


@Route.get
def get(request):
    return (
        {"name": "Donald"},
        {"name": "Ryan"},
    )
