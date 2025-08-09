from primate import view

def get(request):
  posts = [{
   "id": 1,
   "title": "First post",
  }]

  return view("Index.jsx", { "posts": posts })
