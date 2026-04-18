from primate import Route


@Route.get
def get(request):
    return {"foo": "bar", "bar": 1}
