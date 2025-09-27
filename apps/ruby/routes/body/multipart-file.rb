# frozen_string_literal: true
#
require 'primate/route'

Route.post do |request|
  fields = request.body.fields

  baz = begin
    Integer(fields["baz"].to_s, 10)
  rescue ArgumentError, TypeError
    0
  end

  foo = fields["foo"].to_s

  greeting = request.body.files.find { |f| f.field == "greeting" }

  name    = greeting&.filename
  typ     = greeting&.content_type
  size    = greeting&.size
  content = if greeting
    greeting.io.read.force_encoding("UTF-8")
  end

  {
    "baz" => baz,
    "foo" => foo,
    "greeting" => {
      "name"    => name,
      "size"    => size,
      "type"    => typ,
      "content" => content,
    },
  }
end
