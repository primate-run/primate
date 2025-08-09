import "primate.run"

func Get(request Request) any {
  posts := Array{Object{
    "id": 1,
    "title": "First post",
  }};

  return primate.View("Index.jsx", Object{
    "posts": posts
  });
}
