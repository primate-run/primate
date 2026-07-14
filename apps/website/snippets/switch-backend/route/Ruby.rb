require 'primate/route'

Route.get do |request|
  Primate.page({ :start => 10 })
end
