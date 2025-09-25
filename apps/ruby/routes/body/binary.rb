require 'primate/route'

Route.post do |request|
  bin = request.body.binary

  {
    "type" => bin.content_type || request.headers["content-type"],
    "size" => bin.size,
    "head" => bin.head(4),
  }
end
