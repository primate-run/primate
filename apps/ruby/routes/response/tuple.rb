require 'primate/route'

# same like array
Route.get do |request|
  [
    { foo: 'bar' },
    { foo: 1 },
  ]
end
