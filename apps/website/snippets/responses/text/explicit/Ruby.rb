require 'primate/route'
require 'primate/response'

Route.post do |request|
  Response.text("Hello from Ruby!", status: 201)
end
