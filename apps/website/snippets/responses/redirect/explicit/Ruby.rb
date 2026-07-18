require 'primate/route'
require 'primate/response'

Route.get do |request|
  Response.redirect('/account')
end

Route.post do |request|
  Response.redirect('/login', 303)
end
