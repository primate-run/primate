require 'primate/route'

Route.get do |request|
  [
    { foo: 'bar' },
    { foo: 1 },
  ]
end
