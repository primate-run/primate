require 'primate/route'

Route.get do |request|
  [{ name: 'Donald' }, { name: 'John' }]
end
