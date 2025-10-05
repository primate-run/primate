require 'primate/route'
require 'primate/response'

Route.get do |request|
  Response.redirect('https://primate.run', 303)
end

Route.post do |request|
  Response.redirect('/login')
end
