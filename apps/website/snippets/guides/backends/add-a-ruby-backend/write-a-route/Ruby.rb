require 'primate/route'

Route.get do |request|
  'Hello from Ruby'
end


Route.post do |request|
  { ok: true }
end
