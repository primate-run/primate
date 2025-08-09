def get(request)
  posts = [{
    id: 1,
    title: "First post",
  }]

  Primate.view("ndex.jsx", { posts: posts })
end
