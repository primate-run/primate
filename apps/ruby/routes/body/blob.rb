require 'primate/route'

Route.post(content_type: "application/octet-stream") do |request|
  blob = request.body.blob
  {
    "type" => blob.content_type,
    "size" => blob.size,
    "head" => blob.head(4),
  }
end
