from primate import Route


@Route.get
def get(request):
    return [
        {"foo": "bar"},
        {"foo": 1},
    ]
