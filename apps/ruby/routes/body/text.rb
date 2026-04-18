require 'primate/route'

Route.post(content_type: "text/plain") do |request|
  request.body.text
end
