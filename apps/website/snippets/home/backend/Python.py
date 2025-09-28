from primate import Route, Response


@Route.get
def get(request):
    posts = [
        {
            "id": 1,
            "title": "First post",
        }
    ]

    return Response.view("Index.jsx", {"posts": posts})
