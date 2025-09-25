require 'primate/route'
require 'primate/pema'

schema = Pema.schema({
  'baz' => Pema.int,
  'foo' => Pema.string
})

Route.get do |request|
  begin
    parsed = request.query.parse(schema, true)
    parsed
  rescue Pema::ValidationError => e
    e.message
  end
end
