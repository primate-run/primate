require 'primate/route'

Route.get do |request|
  if request.query.has?('foo')
    request.query.get('foo')
  else
    'foo missing'
  end
end
