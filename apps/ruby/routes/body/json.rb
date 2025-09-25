require 'primate/route'

Route.post do |request|
  request.body.json
end
