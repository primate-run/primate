require 'primate/route'

Route.get do |request|
  { foo: 'bar', bar: 1 }
end
