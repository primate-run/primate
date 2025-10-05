require 'primate/route'
require 'primate/response'

Route.get do |request|
  Response.error(body: 'Not Found')
end
