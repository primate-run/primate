require 'primate/route'

Route.get do |request|
  "Hello from GET!";
end

Route.post do |request|
  "Hello from POST!";
end
