require 'primate/route'

Route.post(content_type: "application/json") do |request|
  request.body.json
end
