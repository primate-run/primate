require 'primate/route'
require 'primate/response'

Route.get do |request|
  Response.view('index.svelte', hello: 'world')
end
