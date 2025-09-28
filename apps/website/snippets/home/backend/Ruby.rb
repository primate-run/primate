require 'primate/route'
require 'primate/response'

Route.get do |request|
  posts = [{
    id: 1,
    title: "First post",
  }]

  Response.view("ndex.jsx", { posts: posts })
end
