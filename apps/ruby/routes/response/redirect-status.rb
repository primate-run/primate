require 'primate/route'
require 'primate/response'

Route.get do |request|
  Response.redirect('/redirected', 301)
end
