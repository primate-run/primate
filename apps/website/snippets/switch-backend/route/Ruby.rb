require 'primate/route'

Route.get do |request|
  Primate.view("Counter.jsx", { :start => 10 })
end
