require 'primate/route'
require 'primate/session'

Route.get do |request|
  Session.create(foo: 'bar' )
  Session.get
end
