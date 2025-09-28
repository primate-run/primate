from primate import Route, Response


@Route.get
def get(request):
    return Response.view("Counter.jsx", {"start": 10})
