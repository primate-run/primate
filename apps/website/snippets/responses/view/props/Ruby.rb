require 'primate/route'
require 'primate/response'

Route.get do |request|
  Response.view('Counter.jsx', start: 10)
end
