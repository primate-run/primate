require 'primate/route'
require 'primate/session'

Route.get do |request|
  Session.try == {} ? Session.try : nil
end
