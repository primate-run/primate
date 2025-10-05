require 'primate/route'
require 'primate/response'

Route.get do |request|
  Response.error(status: 500)
end
