from primate import Response, Route


@Route.get
def get(request):
    return Response.view("index.svelte", {"hello": "world"})
