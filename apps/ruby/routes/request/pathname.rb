require 'primate/route'

Route.get do |request|
  request.url.pathname
end
