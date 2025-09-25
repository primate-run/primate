# frozen_string_literal: true
#
require 'primate/route'

Route.post do |request|
  # 1) Plain fields (already parsed JSON as Ruby Hash)
  fields = request.body.fields

  # baz: "1" -> 1 (coerce like the Go example, default 0 on failure)
  baz = begin
    Integer(fields["baz"].to_s, 10)
  rescue ArgumentError, TypeError
    0
  end

  # foo stays a string (nil -> "")
  foo = fields["foo"].to_s

  # 2) Files (read-only, WASM-friendly)
  greeting = request.body.files.find { |f| f.field == "greeting" }

  name    = greeting&.filename
  typ     = greeting&.content_type
  size    = greeting&.size
  content = if greeting
    # file is a UTF-8 text in this test; read bytes and set encoding
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
